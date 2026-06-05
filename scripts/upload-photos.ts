/**
 * Local image compressor + uploader.
 *
 * Reads every JPEG/PNG/HEIC/TIFF in a directory, optimizes each to WebP fitted
 * to a web-friendly maximum dimension, extracts EXIF, uploads to Supabase
 * Storage, and inserts a row in `public.photos` linked to a collection.
 *
 * Usage:
 *   npm run photos:upload -- --collection "Tokyo 2025" --dir ./incoming/tokyo --publish
 *
 * Flags:
 *   --collection <title>     (required) Collection title. Created if it doesn't exist.
 *   --slug <slug>            Optional custom slug; otherwise derived from --collection.
 *   --dir <path>             (required) Directory containing source images.
 *   --max <px>               Max dimension. Default: 2400.
 *   --quality <0-100>        WebP quality. Default: 82.
 *   --publish                Mark both the collection and uploaded photos as published.
 *   --description <text>     Collection description (only on first creation).
 *   --location <text>        Collection location (only on first creation).
 *   --date <YYYY-MM-DD>      Collection date_taken (only on first creation).
 *
 * Auth: requires SUPABASE_SECRET_KEY (service role) in .env.local — bypasses RLS.
 */
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import exifr from "exifr";
import type { Database } from "../lib/database.types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Load env from .env.local manually (no dotenv dep) ----
async function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
  const content = await readFile(envPath, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// ---- CLI parsing ----
type Args = {
  collection: string;
  slug?: string;
  dir: string;
  max: number;
  quality: number;
  publish: boolean;
  description?: string;
  location?: string;
  date?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> & { max?: number; quality?: number; publish?: boolean } = {
    max: 2400,
    quality: 82,
    publish: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    const next = argv[i + 1];
    switch (token) {
      case "--collection":
        args.collection = next;
        i++;
        break;
      case "--slug":
        args.slug = next;
        i++;
        break;
      case "--dir":
        args.dir = next;
        i++;
        break;
      case "--max":
        args.max = Number(next);
        i++;
        break;
      case "--quality":
        args.quality = Number(next);
        i++;
        break;
      case "--description":
        args.description = next;
        i++;
        break;
      case "--location":
        args.location = next;
        i++;
        break;
      case "--date":
        args.date = next;
        i++;
        break;
      case "--publish":
        args.publish = true;
        break;
      case "--help":
      case "-h":
        printHelpAndExit(0);
        break;
    }
  }
  if (!args.collection || !args.dir) {
    console.error("✖ --collection and --dir are required.\n");
    printHelpAndExit(1);
  }
  return args as Args;
}

function printHelpAndExit(code: number): never {
  console.log(`Local photo uploader

Usage:
  npm run photos:upload -- --collection "Tokyo 2025" --dir ./incoming/tokyo [options]

Required:
  --collection <title>     Collection title (created if missing)
  --dir <path>             Directory containing source images

Optional:
  --slug <slug>            Custom URL slug (derived from title by default)
  --max <px>               Max longest-side in pixels (default 2400)
  --quality <0-100>        WebP quality (default 82)
  --publish                Mark collection and photos as published
  --description <text>     Collection description (on creation)
  --location <text>        Collection location (on creation)
  --date <YYYY-MM-DD>      Collection date_taken (on creation)
`);
  process.exit(code);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ---- EXIF helpers ----
type ExifData = Awaited<ReturnType<typeof exifr.parse>>;

function formatShutter(value: unknown): string | null {
  if (typeof value !== "number" || !isFinite(value) || value <= 0) return null;
  if (value >= 1) return `${value.toFixed(1)}s`;
  const denom = Math.round(1 / value);
  return `1/${denom}s`;
}

function formatFocal(value: unknown): string | null {
  if (typeof value !== "number" || !isFinite(value)) return null;
  return `${Math.round(value)}mm`;
}

function formatAperture(value: unknown): string | null {
  if (typeof value !== "number" || !isFinite(value)) return null;
  return value.toFixed(1);
}

function exifCamera(exif: ExifData): string | null {
  if (!exif) return null;
  const make = typeof exif.Make === "string" ? exif.Make.trim() : "";
  const model = typeof exif.Model === "string" ? exif.Model.trim() : "";
  if (!make && !model) return null;
  if (model.toLowerCase().startsWith(make.toLowerCase())) return model;
  return [make, model].filter(Boolean).join(" ");
}

// ---- Main ----
const SUPPORTED_EXTS = new Set([".jpg", ".jpeg", ".png", ".heic", ".heif", ".tif", ".tiff", ".webp"]);

async function main() {
  await loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error(
      "✖ Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (service role) in .env.local."
    );
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const sourceDir = path.resolve(process.cwd(), args.dir);
  if (!existsSync(sourceDir)) {
    console.error(`✖ Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Get-or-create collection
  const slug = args.slug ? slugify(args.slug) : slugify(args.collection);
  let collectionId: string;
  {
    const { data: existing, error: findErr } = await supabase
      .from("collections")
      .select("id, title")
      .eq("slug", slug)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing) {
      console.log(`→ Using existing collection: "${existing.title}" (${slug})`);
      collectionId = existing.id;
      if (args.publish) {
        await supabase.from("collections").update({ is_published: true }).eq("id", existing.id);
      }
    } else {
      const { data: created, error: insertErr } = await supabase
        .from("collections")
        .insert({
          slug,
          title: args.collection,
          description: args.description ?? null,
          location: args.location ?? null,
          date_taken: args.date ?? null,
          is_published: args.publish,
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      collectionId = created.id;
      console.log(`✚ Created collection: "${args.collection}" (${slug})`);
    }
  }

  // 2. Find source images
  const entries = await readdir(sourceDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && SUPPORTED_EXTS.has(path.extname(e.name).toLowerCase()))
    .map((e) => path.join(sourceDir, e.name))
    .sort();

  if (files.length === 0) {
    console.warn(`⚠ No supported images found in ${sourceDir}`);
    return;
  }
  console.log(`→ Processing ${files.length} image(s) (max ${args.max}px, q${args.quality})\n`);

  // 3. Ensure output cache dir exists for any debug/local writes
  const cacheDir = path.resolve(process.cwd(), ".cache", "uploads");
  await mkdir(cacheDir, { recursive: true });

  let uploaded = 0;
  let skipped = 0;
  let nextOrder = 0;

  // Use file ordering for display_order — earlier filenames first means higher display_order
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const filename = path.basename(filePath);
    const displayOrder = files.length - i; // first file gets highest order

    try {
      const buffer = await readFile(filePath);

      // EXIF — pass `true` to read the default tag set (camera, lens, exposure, dates).
      let exif: ExifData = null;
      try {
        exif = await exifr.parse(buffer, true);
      } catch {
        // continue without EXIF
      }

      // Pipeline: rotate (honors EXIF orientation), resize within bounds, webp
      const image = sharp(buffer, { failOn: "none" }).rotate();
      const metadata = await image.metadata();
      const sourceWidth = metadata.width ?? null;
      const sourceHeight = metadata.height ?? null;

      const processed = await image
        .resize({
          width: args.max,
          height: args.max,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: args.quality, effort: 5 })
        .toBuffer({ resolveWithObject: true });

      const outWidth = processed.info.width;
      const outHeight = processed.info.height;

      const baseName = slugify(path.basename(filename, path.extname(filename))) || "photo";
      const stamp = Date.now().toString(36);
      const storagePath = `${slug}/${baseName}-${stamp}.webp`;

      const sourceKb = (buffer.byteLength / 1024).toFixed(0);
      const outKb = (processed.data.byteLength / 1024).toFixed(0);
      const sizeInfo = `${sourceKb}KB→${outKb}KB`;
      const dimInfo = `${sourceWidth ?? "?"}×${sourceHeight ?? "?"}→${outWidth}×${outHeight}`;

      // 4. Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(storagePath, processed.data, {
          contentType: "image/webp",
          cacheControl: "31536000, immutable",
          upsert: false,
        });
      if (uploadErr) {
        console.error(`  ✖ ${filename}: upload failed — ${uploadErr.message}`);
        skipped++;
        continue;
      }

      // 5. Insert photo row
      const takenAt =
        exif && exif.DateTimeOriginal instanceof Date
          ? exif.DateTimeOriginal.toISOString()
          : exif && typeof exif.DateTimeOriginal === "string"
            ? exif.DateTimeOriginal
            : null;

      const { error: insertErr } = await supabase.from("photos").insert({
        collection_id: collectionId,
        storage_path: storagePath,
        width: outWidth,
        height: outHeight,
        camera: exifCamera(exif),
        lens: exif?.LensModel ?? exif?.Lens ?? null,
        focal_length: formatFocal(exif?.FocalLength),
        aperture: formatAperture(exif?.FNumber),
        shutter_speed: formatShutter(exif?.ExposureTime),
        iso: typeof exif?.ISO === "number" ? exif.ISO : null,
        taken_at: takenAt,
        display_order: displayOrder,
        is_published: args.publish,
      });

      if (insertErr) {
        // Roll back the uploaded object so we don't orphan storage.
        await supabase.storage.from("photos").remove([storagePath]);
        console.error(`  ✖ ${filename}: insert failed — ${insertErr.message}`);
        skipped++;
        continue;
      }

      console.log(`  ✓ ${filename}  ${dimInfo}  ${sizeInfo}`);
      uploaded++;
      nextOrder++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✖ ${filename}: ${message}`);
      skipped++;
    }
  }

  console.log(`\nDone. Uploaded ${uploaded}, skipped ${skipped}. Collection: /photography/${slug}`);

  // Suppress 'unused' lint since we track nextOrder for clarity in future extensions.
  void nextOrder;

  // Best-effort: write a short manifest of what just happened.
  const manifest = {
    collection: { slug, title: args.collection, id: collectionId },
    uploaded,
    skipped,
    at: new Date().toISOString(),
  };
  await writeFile(
    path.join(cacheDir, `${slug}-${Date.now()}.json`),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  ).catch(() => {});
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
