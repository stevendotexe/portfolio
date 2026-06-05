"use client";

import { useId, useState, useTransition, useEffect } from "react";
import { getPhotoPublicUrl } from "@/lib/supabase";
import { compressImage, extractExif } from "@/lib/image-compress";
import { slugify } from "@/lib/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deletePhotoAction,
  updatePhotoOrderAction,
  setCollectionCoverPhotoAction,
} from "@/app/admin/actions";

interface PhotoItem {
  id: string;
  storage_path: string;
  display_order: number;
  taken_at: string | null;
  camera: string | null;
}

interface CollectionPhotosManagerProps {
  collectionId: string;
  collectionSlug: string;
  collectionTitle: string;
  initialCoverPhotoId: string | null;
  photos: PhotoItem[];
}

export function CollectionPhotosManager({
  collectionId,
  collectionSlug,
  collectionTitle,
  initialCoverPhotoId,
  photos,
}: CollectionPhotosManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(initialCoverPhotoId);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputId = useId();

  const supabase = createSupabaseBrowserClient();

  // Sync state if initialCoverPhotoId prop changes
  useEffect(() => {
    setCoverPhotoId(initialCoverPhotoId);
  }, [initialCoverPhotoId]);

  // Sort photos: display_order descending, then taken_at descending
  const sortedPhotos = [...photos].sort((a, b) => {
    if (b.display_order !== a.display_order) {
      return b.display_order - a.display_order;
    }
    const dateA = a.taken_at ? new Date(a.taken_at).getTime() : 0;
    const dateB = b.taken_at ? new Date(b.taken_at).getTime() : 0;
    return dateB - dateA;
  });

  const handleSetCover = (photoId: string) => {
    setError(null);
    startTransition(async () => {
      // If clicking already selected cover, toggle it off (set to null)
      const nextCoverId = coverPhotoId === photoId ? null : photoId;
      const result = await setCollectionCoverPhotoAction(collectionId, nextCoverId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCoverPhotoId(nextCoverId);
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = index + (direction === "up" ? -1 : 1);
    if (targetIndex < 0 || targetIndex >= sortedPhotos.length) return;

    const currentPhoto = sortedPhotos[index];
    const targetPhoto = sortedPhotos[targetIndex];

    const currentOrder = currentPhoto.display_order;
    const targetOrder = targetPhoto.display_order;

    let nextCurrentOrder = targetOrder;
    let nextTargetOrder = currentOrder;

    if (currentOrder === targetOrder) {
      if (direction === "up") {
        nextCurrentOrder = currentOrder + 1;
      } else {
        nextTargetOrder = currentOrder + 1;
      }
    }

    setError(null);
    startTransition(async () => {
      const r1 = await updatePhotoOrderAction(currentPhoto.id, nextCurrentOrder);
      const r2 = await updatePhotoOrderAction(targetPhoto.id, nextTargetOrder);
      if (!r1.ok) {
        setError(r1.error);
      } else if (!r2.ok) {
        setError(r2.error);
      }
    });
  };

  const handleDelete = (photoId: string, storagePath: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this photo? This will permanently remove it from this collection and delete the file."
      )
    ) {
      return;
    }

    setError(null);
    setDeletingId(photoId);
    startTransition(async () => {
      const result = await deletePhotoAction(photoId, storagePath);
      if (!result.ok) {
        setError(result.error);
      } else {
        if (coverPhotoId === photoId) {
          setCoverPhotoId(null);
        }
      }
      setDeletingId(null);
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const [compressed, exif] = await Promise.all([
        compressImage(file, { maxDimension: 2400, quality: 0.82 }),
        extractExif(file),
      ]);

      const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "photo";
      const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const storagePath = `${collectionSlug}/${baseName}-thumb-${stamp}.webp`;

      const { error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(storagePath, compressed.blob, {
          contentType: "image/webp",
          cacheControl: "31536000, immutable",
          upsert: false,
        });

      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

      // Calculate next display order (higher than any existing)
      const maxOrder = photos.reduce((max, p) => (p.display_order > max ? p.display_order : max), 0);

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
        display_order: maxOrder + 1,
        is_published: true,
      });

      if (insertErr) {
        await supabase.storage.from("photos").remove([storagePath]);
        throw new Error(`Failed to save photo metadata: ${insertErr.message}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <div className="admin-photos-manager">
      <button
        type="button"
        className="admin-photos-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            marginRight: "6px",
          }}
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span>Manage Photos ({photos.length})</span>
      </button>

      {isOpen && (
        <div className="admin-photos-panel">
          {error && (
            <div className="uploader-error" style={{ marginBottom: "16px" }} role="alert">
              {error}
            </div>
          )}

          <div className="admin-photos-grid">
            {sortedPhotos.map((photo, index) => {
              const isDeleting = deletingId === photo.id;
              const isCover = coverPhotoId === photo.id;
              const fileName = photo.storage_path.split("/").pop() ?? "Photo";
              const isFirst = index === 0;
              const isLast = index === sortedPhotos.length - 1;

              return (
                <div
                  key={photo.id}
                  className={`admin-photo-card${isDeleting ? " admin-photo-card-deleting" : ""}${
                    isCover ? " admin-photo-card-cover" : ""
                  }`}
                >
                  <div className="admin-photo-thumb">
                    <img
                      src={getPhotoPublicUrl(photo.storage_path)}
                      alt={fileName}
                      loading="lazy"
                    />
                    {isCover && <span className="admin-photo-cover-badge">Cover</span>}
                  </div>
                  
                  <div className="admin-photo-info">
                    <p className="admin-photo-name" title={fileName}>
                      {fileName}
                    </p>
                  </div>

                  <div className="admin-photo-actions-row">
                    {/* Cover Photo Selector */}
                    <button
                      type="button"
                      className={`admin-photo-action-btn admin-photo-btn-cover${isCover ? " active" : ""}`}
                      onClick={() => handleSetCover(photo.id)}
                      disabled={isPending || isDeleting}
                      title={isCover ? "Remove cover photo" : "Set as cover photo"}
                      aria-label="Set as cover photo"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={isCover ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>

                    {/* Order Controls */}
                    <button
                      type="button"
                      className="admin-photo-action-btn"
                      onClick={() => handleMove(index, "up")}
                      disabled={isFirst || isPending || isDeleting}
                      title="Move earlier"
                      aria-label="Move photo earlier"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="admin-photo-action-btn"
                      onClick={() => handleMove(index, "down")}
                      disabled={isLast || isPending || isDeleting}
                      title="Move later"
                      aria-label="Move photo later"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    {/* Delete Control */}
                    <button
                      type="button"
                      className="admin-photo-action-btn admin-photo-btn-danger"
                      onClick={() => handleDelete(photo.id, photo.storage_path)}
                      disabled={isPending || isDeleting}
                      title="Delete photo"
                      aria-label="Delete photo"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Direct Upload Card */}
            <label className="admin-photo-upload-card" htmlFor={fileInputId}>
              <input
                id={fileInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUpload}
                disabled={isUploading}
                hidden
              />
              {isUploading ? (
                <span className="admin-photo-upload-spinner">Uploading…</span>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Upload Photo</span>
                </>
              )}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
