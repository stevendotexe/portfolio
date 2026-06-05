"use client";

import { useId, useState, useTransition, useEffect } from "react";
import { compressImage, extractExif } from "@/lib/image-compress";
import { slugify } from "@/lib/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPhotoPublicUrl } from "@/lib/supabase";
import { setCollectionCoverPhotoAction } from "@/app/admin/actions";

interface PhotoOption {
  id: string;
  storage_path: string;
}

interface CollectionThumbnailManagerProps {
  collectionId: string;
  collectionSlug: string;
  collectionTitle: string;
  initialCoverPhotoId: string | null;
  coverPhotoPath: string | null;
  photos: PhotoOption[];
}

export function CollectionThumbnailManager({
  collectionId,
  collectionSlug,
  collectionTitle,
  initialCoverPhotoId,
  coverPhotoPath,
  photos,
}: CollectionThumbnailManagerProps) {
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(initialCoverPhotoId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputId = useId();

  const supabase = createSupabaseBrowserClient();

  // Sync state if initialCoverPhotoId prop changes
  useEffect(() => {
    setCoverPhotoId(initialCoverPhotoId);
  }, [initialCoverPhotoId]);

  // If no cover photo is explicitly selected, fall back to the first available photo in the collection
  const currentPhotoPath = coverPhotoPath || photos[0]?.storage_path || null;
  const isFallback = !coverPhotoId && photos.length > 0;
  const previewUrl = currentPhotoPath ? getPhotoPublicUrl(currentPhotoPath) : null;

  const handleSetCover = (photoId: string | null) => {
    setError(null);
    startTransition(async () => {
      const result = await setCollectionCoverPhotoAction(collectionId, photoId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCoverPhotoId(photoId);
      setIsModalOpen(false);
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

      const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "thumbnail";
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

      // Calculate next display order
      const maxOrder = photos.reduce((max, p) => {
        const order = (p as { display_order?: number }).display_order ?? 0;
        return order > max ? order : max;
      }, 0);

      const { data: photoData, error: insertErr } = await supabase
        .from("photos")
        .insert({
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
        })
        .select("id")
        .single();

      if (insertErr) {
        await supabase.storage.from("photos").remove([storagePath]);
        throw new Error(`Failed to save photo metadata: ${insertErr.message}`);
      }

      const newPhotoId = photoData.id;

      const result = await setCollectionCoverPhotoAction(collectionId, newPhotoId);
      if (!result.ok) {
        throw new Error(`Failed to update collection cover photo: ${result.error}`);
      }

      setCoverPhotoId(newPhotoId);
      setIsModalOpen(false);
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
    <div className="admin-thumbnail-manager">
      {/* Clickable cover photo preview box */}
      <button
        type="button"
        className="admin-thumbnail-preview"
        onClick={() => setIsModalOpen(true)}
        title="Click to change collection cover photo"
        aria-label="Change collection cover photo"
      >
        {previewUrl ? (
          <img src={previewUrl} alt={`${collectionTitle} thumbnail`} className="admin-thumbnail-img" />
        ) : (
          <div className="admin-thumbnail-placeholder" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        {isFallback && <span className="admin-thumbnail-badge">Auto</span>}
      </button>

      {/* Visual Modal Picker Pop-up */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)} role="dialog" aria-modal="true">
          <div className="admin-modal-content" onClick={(event) => event.stopPropagation()}>
            <header className="admin-modal-header">
              <h3>Select Cover Photo — {collectionTitle}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </header>

            <div className="admin-modal-body">
              {error && (
                <div className="uploader-error" style={{ marginBottom: "12px" }} role="alert">
                  {error}
                </div>
              )}

              {/* Automatic Fallback Toggle */}
              <button
                type="button"
                className={`admin-modal-fallback-btn${!coverPhotoId ? " active" : ""}`}
                onClick={() => handleSetCover(null)}
                disabled={isPending || isUploading}
              >
                Use Automatic Fallback (Most Recent Photo)
              </button>

              {/* Photo Choice Grid */}
              <div className="admin-modal-grid">
                {photos.map((p) => {
                  const isCurrent = coverPhotoId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`admin-modal-photo-card${isCurrent ? " active" : ""}`}
                      onClick={() => handleSetCover(p.id)}
                      disabled={isPending || isUploading}
                      title={isCurrent ? "Current cover photo" : "Set as cover photo"}
                    >
                      <img src={getPhotoPublicUrl(p.storage_path)} alt="Selection option" />
                      {isCurrent && (
                        <span className="admin-modal-star" aria-hidden="true">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Direct Upload Card inside Modal */}
                <label className="admin-modal-upload-card" htmlFor={fileInputId}>
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUpload}
                    disabled={isUploading || isPending}
                    hidden
                  />
                  {isUploading ? (
                    <span className="admin-modal-upload-spinner">Uploading…</span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginBottom: "4px" }}>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Upload New</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
