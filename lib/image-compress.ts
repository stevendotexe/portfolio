"use client";

import exifr from "exifr";

export interface CompressOptions {
  /** Longest-side maximum in pixels. */
  maxDimension?: number;
  /** WebP quality 0–1. */
  quality?: number;
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  /** WebP MIME type for upload metadata. */
  contentType: "image/webp";
}

export interface ExtractedExif {
  camera: string | null;
  lens: string | null;
  focal_length: string | null;
  aperture: string | null;
  shutter_speed: string | null;
  iso: number | null;
  taken_at: string | null;
}

const DEFAULT_MAX = 2400;
const DEFAULT_QUALITY = 0.82;

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImage> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX;
  const quality = options.quality ?? DEFAULT_QUALITY;

  // Modern browsers (Chrome 81+, Firefox 77+, Safari 13.1+) honor EXIF orientation
  // automatically when drawing <img> elements to canvas.
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = objectUrl;
    await img.decode();

    const ratio = Math.min(
      maxDimension / img.naturalWidth,
      maxDimension / img.naturalHeight,
      1
    );
    const width = Math.round(img.naturalWidth * ratio);
    const height = Math.round(img.naturalHeight * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D context unavailable.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    if (!blob) throw new Error("Failed to encode WebP — browser may not support image/webp.");

    return { blob, width, height, contentType: "image/webp" };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatShutter(value: unknown): string | null {
  if (typeof value !== "number" || !isFinite(value) || value <= 0) return null;
  if (value >= 1) return `${value.toFixed(1)}s`;
  return `1/${Math.round(1 / value)}s`;
}

function formatFocal(value: unknown): string | null {
  if (typeof value !== "number" || !isFinite(value)) return null;
  return `${Math.round(value)}mm`;
}

function formatAperture(value: unknown): string | null {
  if (typeof value !== "number" || !isFinite(value)) return null;
  return value.toFixed(1);
}

export async function extractExif(file: File): Promise<ExtractedExif> {
  const empty: ExtractedExif = {
    camera: null,
    lens: null,
    focal_length: null,
    aperture: null,
    shutter_speed: null,
    iso: null,
    taken_at: null,
  };

  try {
    const exif = await exifr.parse(file, true);
    if (!exif) return empty;

    const make = typeof exif.Make === "string" ? exif.Make.trim() : "";
    const model = typeof exif.Model === "string" ? exif.Model.trim() : "";
    const camera = !make && !model
      ? null
      : model && make && model.toLowerCase().startsWith(make.toLowerCase())
        ? model
        : [make, model].filter(Boolean).join(" ");

    const takenAtRaw = exif.DateTimeOriginal ?? exif.CreateDate ?? null;
    let takenAt: string | null = null;
    if (takenAtRaw instanceof Date && !Number.isNaN(takenAtRaw.getTime())) {
      takenAt = takenAtRaw.toISOString();
    } else if (typeof takenAtRaw === "string") {
      takenAt = takenAtRaw;
    }

    return {
      camera,
      lens: exif.LensModel ?? exif.Lens ?? null,
      focal_length: formatFocal(exif.FocalLength),
      aperture: formatAperture(exif.FNumber),
      shutter_speed: formatShutter(exif.ExposureTime),
      iso: typeof exif.ISO === "number" ? exif.ISO : null,
      taken_at: takenAt,
    };
  } catch {
    return empty;
  }
}
