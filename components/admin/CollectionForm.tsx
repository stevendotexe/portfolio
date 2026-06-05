"use client";

import { useState, useTransition } from "react";
import { createCollectionAction } from "@/app/admin/actions";
import { slugify } from "@/lib/slug";

export function CollectionForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateTaken, setDateTaken] = useState("");
  const [publish, setPublish] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const computedSlug = slugTouched ? slug : slugify(title);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(event.currentTarget);
    formData.set("slug", computedSlug);

    startTransition(async () => {
      const result = await createCollectionAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`Collection "${title}" created.`);
      setTitle("");
      setSlug("");
      setSlugTouched(false);
      setDescription("");
      setLocation("");
      setDateTaken("");
      setPublish(false);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="collection-form">
      <div className="collection-form-grid">
        <label className="auth-field">
          <span>Title *</span>
          <input
            type="text"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Tokyo 2025"
            required
            disabled={isPending}
          />
        </label>
        <label className="auth-field">
          <span>Slug</span>
          <input
            type="text"
            name="slug-display"
            value={computedSlug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            placeholder="tokyo-2025"
            disabled={isPending}
          />
        </label>
        <label className="auth-field">
          <span>Date</span>
          <input
            type="date"
            name="date_taken"
            value={dateTaken}
            onChange={(event) => setDateTaken(event.target.value)}
            disabled={isPending}
          />
        </label>
        <label className="auth-field">
          <span>Location</span>
          <input
            type="text"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Tokyo, Japan"
            disabled={isPending}
          />
        </label>
        <label className="auth-field collection-form-full">
          <span>Description</span>
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Cherry blossoms and neon nights."
            rows={3}
            disabled={isPending}
          />
        </label>
      </div>

      <div className="collection-form-footer">
        <label className="uploader-checkbox">
          <input
            type="checkbox"
            name="publish"
            checked={publish}
            onChange={(event) => setPublish(event.target.checked)}
            disabled={isPending}
          />
          <span>Publish immediately</span>
        </label>
        <button type="submit" className="auth-submit collection-form-submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create collection"}
        </button>
      </div>

      {error && <p className="uploader-error" role="alert">{error}</p>}
      {success && <p className="uploader-success" role="status">{success}</p>}
    </form>
  );
}
