import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getPhotoPublicUrl, supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Photography",
  description:
    "A visual diary by Steven Simbolon — moments, places, and people captured through the lens.",
  openGraph: {
    title: "Photography | Steven Simbolon",
    description:
      "A visual diary — moments, places, and people captured through the lens.",
  },
};

type CollectionWithCover = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  date_taken: string | null;
  location: string | null;
  cover_photo: {
    storage_path: string;
    width: number | null;
    height: number | null;
    alt_text: string | null;
  } | null;
  photoCount: number;
};

async function getCollections(): Promise<CollectionWithCover[]> {
  const { data: collections, error } = await supabase
    .from("collections")
    .select(
      `id, slug, title, description, date_taken, location, cover_photo_id,
       cover:photos!collections_cover_photo_fk (storage_path, width, height, alt_text)`
    )
    .eq("is_published", true)
    .order("display_order", { ascending: false })
    .order("date_taken", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Failed to load collections:", error.message);
    return [];
  }
  if (!collections || collections.length === 0) return [];

  // For collections without an explicit cover_photo_id, fall back to the most
  // recent published photo in that collection and also count photos.
  const ids = collections.map((c) => c.id);
  const { data: photoStats } = await supabase
    .from("photos")
    .select("collection_id, storage_path, width, height, alt_text, taken_at, display_order")
    .in("collection_id", ids)
    .eq("is_published", true)
    .order("display_order", { ascending: false })
    .order("taken_at", { ascending: false, nullsFirst: false });

  const fallbackByCollection = new Map<
    string,
    { storage_path: string; width: number | null; height: number | null; alt_text: string | null }
  >();
  const countsByCollection = new Map<string, number>();

  for (const photo of photoStats ?? []) {
    if (!photo.collection_id) continue;
    countsByCollection.set(
      photo.collection_id,
      (countsByCollection.get(photo.collection_id) ?? 0) + 1
    );
    if (!fallbackByCollection.has(photo.collection_id)) {
      fallbackByCollection.set(photo.collection_id, {
        storage_path: photo.storage_path,
        width: photo.width,
        height: photo.height,
        alt_text: photo.alt_text,
      });
    }
  }

  return collections.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    date_taken: c.date_taken,
    location: c.location,
    cover_photo: c.cover ?? fallbackByCollection.get(c.id) ?? null,
    photoCount: countsByCollection.get(c.id) ?? 0,
  }));
}

function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

export default async function PhotographyPage() {
  const collections = await getCollections();

  return (
    <>
      <Navbar />
      <main>
        <section className="photography-section">
          <div className="container">
            <header className="photography-header">
              <p className="photography-eyebrow">Visual Diary</p>
              <h1 className="photography-title">Photography</h1>
              <p className="photography-subtitle">
                A growing collection of moments — places, people, and light worth remembering.
              </p>
            </header>

            {collections.length === 0 ? (
              <div className="photography-empty">
                <div className="photography-empty-icon" aria-hidden="true">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </div>
                <h2 className="photography-empty-title">Developing in the darkroom</h2>
                <p className="photography-empty-text">
                  No collections have been published yet. Check back soon — frames are being curated.
                </p>
              </div>
            ) : (
              <div className="collection-grid">
                {collections.map((collection) => {
                  const cover = collection.cover_photo;
                  const formattedDate = formatDate(collection.date_taken);
                  return (
                    <Link
                      key={collection.id}
                      href={`/photography/${collection.slug}`}
                      className="collection-card"
                    >
                      <div className="collection-cover">
                        {cover ? (
                          <Image
                            src={getPhotoPublicUrl(cover.storage_path)}
                            alt={cover.alt_text ?? collection.title}
                            width={cover.width ?? 1200}
                            height={cover.height ?? 800}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="collection-cover-image"
                          />
                        ) : (
                          <div className="collection-cover-placeholder" aria-hidden="true">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinejoin="round"
                              />
                              <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                            </svg>
                          </div>
                        )}
                        <div className="collection-cover-overlay" />
                        <span className="collection-count">
                          {collection.photoCount} photo{collection.photoCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="collection-body">
                        <div className="collection-meta">
                          {formattedDate && <span>{formattedDate}</span>}
                          {collection.location && <span>{collection.location}</span>}
                        </div>
                        <h3 className="collection-title">{collection.title}</h3>
                        {collection.description && (
                          <p className="collection-desc">{collection.description}</p>
                        )}
                        <span className="collection-cta" aria-hidden="true">
                          View collection →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
