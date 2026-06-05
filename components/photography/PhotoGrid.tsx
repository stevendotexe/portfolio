"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export interface PhotoItem {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  title: string | null;
  caption: string | null;
  location: string | null;
  exif: string | null;
  dateTaken: string | null;
}

function LightboxOverlay({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: PhotoItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasPrev) onPrev();
      if (event.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasPrev, hasNext, onClose, onPrev, onNext]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Focus trap — put focus on the dialog when it opens
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      className="lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
    >
      {/* Stop click-through on the inner content */}
      <div
        className="lightbox-inner"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
      >
        <button
          className="lightbox-close"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {hasPrev && (
          <button
            className="lightbox-nav lightbox-nav-prev"
            onClick={onPrev}
            aria-label="Previous photo"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div className="lightbox-image-wrap">
          <Image
            key={photo.id}
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 768px) 100vw, 90vw"
            className="lightbox-image"
            priority
          />
        </div>

        {hasNext && (
          <button
            className="lightbox-nav lightbox-nav-next"
            onClick={onNext}
            aria-label="Next photo"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {(photo.title || photo.caption || photo.dateTaken || photo.location || photo.exif) && (
          <footer className="lightbox-footer">
            <div className="lightbox-footer-text">
              {photo.title && <p className="lightbox-title">{photo.title}</p>}
              {photo.caption && <p className="lightbox-caption">{photo.caption}</p>}
            </div>
            {(photo.dateTaken || photo.location || photo.exif) && (
              <div className="lightbox-meta">
                {photo.dateTaken && <span>{photo.dateTaken}</span>}
                {photo.location && <span>{photo.location}</span>}
                {photo.exif && <span>{photo.exif}</span>}
              </div>
            )}
          </footer>
        )}

        <div className="lightbox-counter">
          {index + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
}

export function PhotoGrid({ photos }: { photos: PhotoItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const openAt = useCallback((index: number) => setActiveIndex(index), []);
  const close = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(
    () => setActiveIndex((i) => (i !== null && i > 0 ? i - 1 : i)),
    []
  );
  const next = useCallback(
    () => setActiveIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i)),
    [photos.length]
  );

  return (
    <>
      <div className="photography-grid">
        {photos.map((photo, index) => (
          <figure key={photo.id} className="photography-item">
            <button
              className="photography-frame photography-frame-btn"
              onClick={() => openAt(index)}
              aria-label={`View ${photo.alt} larger`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading={index < 3 ? "eager" : "lazy"}
                priority={index < 3}
                className="photography-image"
              />
              <span className="photography-zoom-hint" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            {(photo.title || photo.caption || photo.dateTaken || photo.location || photo.exif) && (
              <figcaption className="photography-caption">
                {photo.title && (
                  <h3 className="photography-caption-title">{photo.title}</h3>
                )}
                {photo.caption && (
                  <p className="photography-caption-text">{photo.caption}</p>
                )}
                <div className="photography-caption-meta">
                  {photo.dateTaken && <span>{photo.dateTaken}</span>}
                  {photo.location && <span>{photo.location}</span>}
                  {photo.exif && <span>{photo.exif}</span>}
                </div>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {activeIndex !== null && (
        <LightboxOverlay
          photos={photos}
          index={activeIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}
