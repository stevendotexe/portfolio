import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PhotoGrid, type PhotoItem } from "@/components/photography/PhotoGrid";
import { getPhotoPublicUrl, supabase, type Photo } from "@/lib/supabase";

export const revalidate = 300;

export async function generateStaticParams() {
  const { data } = await supabase
    .from("collections")
    .select("slug")
    .eq("is_published", true);
  return (data ?? []).map(({ slug }) => ({ slug }));
}

type RouteParams = { slug: string };

async function loadCollection(slug: string) {
  const { data: collection, error } = await supabase
    .from("collections")
    .select("id, slug, title, description, date_taken, location")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load collection:", error.message);
    return null;
  }
  if (!collection) return null;

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("collection_id", collection.id)
    .eq("is_published", true)
    .order("display_order", { ascending: false })
    .order("taken_at", { ascending: false, nullsFirst: false });

  return { collection, photos: (photos ?? []) as Photo[] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadCollection(slug);
  if (!data) {
    return { title: "Collection not found" };
  }
  const { collection } = data;
  return {
    title: collection.title,
    description: collection.description ?? `Photography collection: ${collection.title}`,
    openGraph: {
      title: `${collection.title} | Photography`,
      description: collection.description ?? undefined,
    },
  };
}

function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatExif(photo: Photo): string | null {
  const parts: string[] = [];
  if (photo.camera) parts.push(photo.camera);
  if (photo.focal_length) parts.push(photo.focal_length);
  if (photo.aperture) parts.push(`f/${photo.aperture.replace(/^f\//i, "")}`);
  if (photo.shutter_speed) parts.push(photo.shutter_speed);
  if (photo.iso) parts.push(`ISO ${photo.iso}`);
  return parts.length ? parts.join(" · ") : null;
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const data = await loadCollection(slug);
  if (!data) notFound();

  const { collection, photos } = data;
  const formattedDate = formatDate(collection.date_taken);

  return (
    <>
      <Navbar />
      <main>
        <section className="photography-section">
          <div className="container">
            <nav className="collection-breadcrumb">
              <Link href="/photography">← Photography</Link>
            </nav>

            <header className="collection-detail-header">
              <div className="collection-detail-meta">
                {formattedDate && <span>{formattedDate}</span>}
                {collection.location && <span>{collection.location}</span>}
                <span>
                  {photos.length} photo{photos.length === 1 ? "" : "s"}
                </span>
              </div>
              <h1 className="collection-detail-title">{collection.title}</h1>
              {collection.description && (
                <p className="collection-detail-description">{collection.description}</p>
              )}
            </header>

            {photos.length === 0 ? (
              <div className="photography-empty">
                <h2 className="photography-empty-title">Photos coming soon</h2>
                <p className="photography-empty-text">
                  This collection doesn&apos;t have any published photos yet.
                </p>
              </div>
            ) : (
              <PhotoGrid photos={photos.map((photo): PhotoItem => ({
                id: photo.id,
                src: getPhotoPublicUrl(photo.storage_path),
                width: photo.width ?? 1200,
                height: photo.height ?? 1600,
                alt: photo.alt_text ?? photo.title ?? "Photograph",
                title: photo.title,
                caption: photo.caption,
                location: photo.location,
                exif: formatExif(photo),
                dateTaken: formatDate(photo.taken_at),
              }))} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
