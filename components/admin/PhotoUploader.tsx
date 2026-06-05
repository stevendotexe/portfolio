"use client";

import { useCallback, useId, useRef, useState } from "react";
import { compressImage, extractExif } from "@/lib/image-compress";
import { slugify } from "@/lib/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getNextPhotoOrderAction,
  revalidatePhotographyAction,
} from "@/app/admin/actions";

export type CollectionOption = {
  id: string;
  slug: string;
  title: string;
};

type EntryStatus =
  | "queued"
  | "compressing"
  | "uploading"
  | "saving"
  | "done"
  | "error";

interface Entry {
  id: string;
  file: File;
  status: EntryStatus;
  message?: string;
  originalSize: number;
  outputSize?: number;
  width?: number;
  height?: number;
}

const ACCEPT = "image/jpeg,image/png,image/webp";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status: EntryStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "compressing":
      return "Compressing";
    case "uploading":
      return "Uploading";
    case "saving":
      return "Saving";
    case "done":
      return "Done";
    case "error":
      return "Error";
  }
}

export function PhotoUploader({ collections }: { collections: CollectionOption[] }) {
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [publish, setPublish] = useState(true);
  const [maxDimension, setMaxDimension] = useState(2400);
  const [quality, setQuality] = useState(82);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputId = useId();
  const dragCounter = useRef(0);

  const supabase = createSupabaseBrowserClient();

  const handleFilesSelected = useCallback((files: FileList | File[]) => {
    const additions: Entry[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPT.split(",").includes(file.type)) continue;
      additions.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        status: "queued",
        originalSize: file.size,
      });
    }
    if (additions.length === 0) return;
    setEntries((prev) => [...prev, ...additions]);
    setGlobalError(null);
  }, []);

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const clearCompleted = () => {
    setEntries((prev) => prev.filter((entry) => entry.status !== "done"));
  };

  const upload = async () => {
    setGlobalError(null);

    if (!collectionId) {
      setGlobalError("Select a collection first.");
      return;
    }
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) {
      setGlobalError("Selected collection not found.");
      return;
    }
    const queued = entries.filter((entry) => entry.status === "queued" || entry.status === "error");
    if (queued.length === 0) return;

    setIsUploading(true);

    const orderResult = await getNextPhotoOrderAction(collectionId);
    if (!orderResult.ok) {
      setGlobalError(orderResult.error);
      setIsUploading(false);
      return;
    }
    let nextOrder = orderResult.nextOrder;

    for (const entry of queued) {
      const setStatus = (status: EntryStatus, patch?: Partial<Entry>) =>
        setEntries((prev) =>
          prev.map((existing) =>
            existing.id === entry.id ? { ...existing, status, ...patch } : existing
          )
        );

      try {
        setStatus("compressing");
        const [compressed, exif] = await Promise.all([
          compressImage(entry.file, {
            maxDimension,
            quality: Math.max(1, Math.min(100, quality)) / 100,
          }),
          extractExif(entry.file),
        ]);

        const baseName = slugify(entry.file.name.replace(/\.[^.]+$/, "")) || "photo";
        const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        const storagePath = `${collection.slug}/${baseName}-${stamp}.webp`;

        setStatus("uploading", {
          outputSize: compressed.blob.size,
          width: compressed.width,
          height: compressed.height,
        });

        const { error: uploadErr } = await supabase.storage
          .from("photos")
          .upload(storagePath, compressed.blob, {
            contentType: "image/webp",
            cacheControl: "31536000, immutable",
            upsert: false,
          });

        if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

        setStatus("saving");

        const { error: insertErr } = await supabase.from("photos").insert({
          collection_id: collectionId,
          storage_path: storagePath,
          width: compressed.width,
          height: compressed.height,
          camera: exif.camera,
          lens: exif.lens,
          focal_length: exif.focal_length,
          aperture: exif.aperture,
          shutter_speed: exif.shutter_speed,
          iso: exif.iso,
          taken_at: exif.taken_at,
          display_order: nextOrder,
          is_published: publish,
        });

        if (insertErr) {
          // Roll back the storage upload so we don't orphan files.
          await supabase.storage.from("photos").remove([storagePath]);
          throw new Error(`Save failed: ${insertErr.message}`);
        }

        nextOrder++;
        setStatus("done");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setStatus("error", { message });
      }
    }

    setIsUploading(false);
    await revalidatePhotographyAction();
  };

  const queuedCount = entries.filter(
    (entry) => entry.status === "queued" || entry.status === "error"
  ).length;
  const doneCount = entries.filter((entry) => entry.status === "done").length;

  if (collections.length === 0) {
    return (
      <div className="uploader-empty">
        Create a collection first, then come back here to upload photos.
      </div>
    );
  }

  return (
    <div className="uploader">
      <div className="uploader-options">
        <label className="uploader-field">
          <span>Collection</span>
          <select
            value={collectionId}
            onChange={(event) => setCollectionId(event.target.value)}
            disabled={isUploading}
          >
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.title}
              </option>
            ))}
          </select>
        </label>

        <label className="uploader-field uploader-field-narrow">
          <span>Max side (px)</span>
          <input
            type="number"
            min={400}
            max={6000}
            step={100}
            value={maxDimension}
            onChange={(event) => setMaxDimension(Number(event.target.value) || 2400)}
            disabled={isUploading}
          />
        </label>

        <label className="uploader-field uploader-field-narrow">
          <span>WebP quality</span>
          <input
            type="number"
            min={40}
            max={100}
            step={1}
            value={quality}
            onChange={(event) => setQuality(Number(event.target.value) || 82)}
            disabled={isUploading}
          />
        </label>

        <label className="uploader-checkbox">
          <input
            type="checkbox"
            checked={publish}
            onChange={(event) => setPublish(event.target.checked)}
            disabled={isUploading}
          />
          <span>Publish immediately</span>
        </label>
      </div>

      <label
        htmlFor={fileInputId}
        className={`uploader-dropzone${isDragging ? " uploader-dropzone-active" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          dragCounter.current++;
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragCounter.current--;
          if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setIsDragging(false);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          dragCounter.current = 0;
          setIsDragging(false);
          if (event.dataTransfer.files.length > 0) {
            handleFilesSelected(event.dataTransfer.files);
          }
        }}
      >
        <input
          id={fileInputId}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) handleFilesSelected(event.target.files);
            event.target.value = "";
          }}
          disabled={isUploading}
        />
        <div className="uploader-dropzone-content">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="uploader-dropzone-text">
            <strong>Drop photos here</strong> or click to browse
          </p>
          <p className="uploader-dropzone-hint">JPEG, PNG, or WebP · processed locally in your browser</p>
        </div>
      </label>

      {globalError && (
        <div className="uploader-error" role="alert">
          {globalError}
        </div>
      )}

      {entries.length > 0 && (
        <div className="uploader-queue">
          <div className="uploader-queue-header">
            <span>
              {queuedCount} pending · {doneCount} uploaded
            </span>
            <div className="uploader-queue-actions">
              {doneCount > 0 && !isUploading && (
                <button type="button" className="uploader-btn-secondary" onClick={clearCompleted}>
                  Clear completed
                </button>
              )}
              <button
                type="button"
                className="uploader-btn-primary"
                onClick={upload}
                disabled={isUploading || queuedCount === 0}
              >
                {isUploading
                  ? "Uploading…"
                  : queuedCount === 0
                    ? "Nothing to upload"
                    : `Upload ${queuedCount}`}
              </button>
            </div>
          </div>
          <ul className="uploader-list">
            {entries.map((entry) => {
              const compressionRatio =
                entry.outputSize && entry.originalSize
                  ? Math.round((1 - entry.outputSize / entry.originalSize) * 100)
                  : null;
              return (
                <li key={entry.id} className={`uploader-list-item uploader-list-item-${entry.status}`}>
                  <div className="uploader-list-info">
                    <p className="uploader-list-name">{entry.file.name}</p>
                    <p className="uploader-list-meta">
                      {formatBytes(entry.originalSize)}
                      {entry.outputSize && ` → ${formatBytes(entry.outputSize)}`}
                      {compressionRatio !== null && compressionRatio > 0 && ` (-${compressionRatio}%)`}
                      {entry.width && entry.height && ` · ${entry.width}×${entry.height}`}
                    </p>
                    {entry.message && entry.status === "error" && (
                      <p className="uploader-list-error">{entry.message}</p>
                    )}
                  </div>
                  <div className="uploader-list-status">
                    <span className={`uploader-status uploader-status-${entry.status}`}>
                      {statusLabel(entry.status)}
                    </span>
                    {(entry.status === "queued" || entry.status === "error") && !isUploading && (
                      <button
                        type="button"
                        className="uploader-list-remove"
                        onClick={() => removeEntry(entry.id)}
                        aria-label={`Remove ${entry.file.name}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
