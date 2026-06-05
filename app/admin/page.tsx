import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/login/actions";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { CollectionPublishToggle } from "@/components/admin/CollectionPublishToggle";
import { CollectionThumbnailManager } from "@/components/admin/CollectionThumbnailManager";
import { CollectionPhotosManager } from "@/components/admin/CollectionPhotosManager";
import { PhotoUploader, type CollectionOption } from "@/components/admin/PhotoUploader";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhotoPublicUrl } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: collections } = await supabase
    .from("collections")
    .select(`
      id,
      slug,
      title,
      description,
      date_taken,
      is_published,
      display_order,
      cover_photo_id,
      cover:photos!collections_cover_photo_fk(storage_path),
      photos:photos!photos_collection_id_fkey(id, storage_path, display_order, taken_at, camera)
    `)
    .order("display_order", { ascending: false })
    .order("date_taken", { ascending: false, nullsFirst: false });

  const { count: photoCount } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true });

  const collectionOptions: CollectionOption[] = (collections ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
  }));

  const publishedCount = (collections ?? []).filter((c) => c.is_published).length;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-inner">
          <Link href="/" className="admin-sidebar-logo">
            <span className="admin-sidebar-logo-dot" />
            <span>Dashboard</span>
          </Link>

          <nav className="admin-nav">
            <p className="admin-nav-label">Content</p>
            <a href="#upload" className="admin-nav-link admin-nav-link-active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Photos
            </a>
            <a href="#collections" className="admin-nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Collections
            </a>
            <a href="#new-collection" className="admin-nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              New Collection
            </a>
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-user">
              <div className="admin-sidebar-avatar">
                {user.email?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="admin-sidebar-user-info">
                <p className="admin-sidebar-user-email">{user.email}</p>
                <p className="admin-sidebar-user-role">Administrator</p>
              </div>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="admin-sidebar-logout" aria-label="Sign out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {/* Page header */}
        <header className="admin-page-header">
          <div>
            <p className="admin-eyebrow">Content Management</p>
            <h1 className="admin-title">Admin Dashboard</h1>
          </div>
          <Link href="/" className="admin-view-site">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View site
          </Link>
        </header>

        {/* Stats */}
        <section className="admin-stats" aria-label="Overview">
          <div className="admin-stat">
            <div className="admin-stat-icon admin-stat-icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div>
              <span className="admin-stat-value">{collections?.length ?? 0}</span>
              <span className="admin-stat-label">Collections</span>
            </div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-icon admin-stat-icon-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div>
              <span className="admin-stat-value">{photoCount ?? 0}</span>
              <span className="admin-stat-label">Total Photos</span>
            </div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-icon admin-stat-icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <span className="admin-stat-value">{publishedCount}</span>
              <span className="admin-stat-label">Published</span>
            </div>
          </div>
        </section>

        {/* Upload photos */}
        <section className="admin-section" id="upload">
          <header className="admin-section-header">
            <div className="admin-section-header-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <h2>Upload Photos</h2>
              <p className="admin-section-subtitle">
                Photos are resized and converted to WebP locally in your browser before upload.
              </p>
            </div>
          </header>
          <div className="admin-section-body">
            <PhotoUploader collections={collectionOptions} />
          </div>
        </section>

        {/* Existing collections */}
        <section className="admin-section" id="collections">
          <header className="admin-section-header">
            <div className="admin-section-header-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div>
              <h2>Collections</h2>
              <p className="admin-section-subtitle">
                {collections?.length ?? 0} collection{collections?.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </header>
          <div className="admin-section-body">
            {!collections || collections.length === 0 ? (
              <div className="admin-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.4, margin: "0 auto 12px" }}>
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                <p>No collections yet. Use the form below to create one.</p>
              </div>
            ) : (
              <ul className="admin-list">
                {collections.map((collection) => (
                  <li key={collection.id} className="admin-list-item">
                    <CollectionThumbnailManager
                      collectionId={collection.id}
                      collectionSlug={collection.slug}
                      collectionTitle={collection.title}
                      initialCoverPhotoId={collection.cover_photo_id}
                      coverPhotoPath={
                        collection.cover
                          ? Array.isArray(collection.cover)
                            ? collection.cover[0]?.storage_path
                            : (collection.cover as { storage_path: string }).storage_path
                          : null
                      }
                      photos={collection.photos ?? []}
                    />
                    <div className="admin-list-item-content">
                      <Link
                        href={`/photography/${collection.slug}`}
                        className="admin-list-title"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {collection.title}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="admin-list-title-icon">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </Link>
                      <p className="admin-list-meta">
                        <span className="admin-list-meta-slug">/{collection.slug}</span>
                        {collection.date_taken && (
                          <span className="admin-list-meta-sep">·</span>
                        )}
                        {collection.date_taken && (
                          <span>{collection.date_taken}</span>
                        )}
                      </p>
                      {collection.description && (
                        <p className="admin-list-desc">{collection.description}</p>
                      )}
                      <CollectionPhotosManager
                        collectionId={collection.id}
                        collectionSlug={collection.slug}
                        collectionTitle={collection.title}
                        initialCoverPhotoId={collection.cover_photo_id}
                        photos={collection.photos ?? []}
                      />
                    </div>
                    <CollectionPublishToggle
                      collectionId={collection.id}
                      initialPublished={collection.is_published}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* New collection */}
        <section className="admin-section" id="new-collection">
          <header className="admin-section-header">
            <div className="admin-section-header-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div>
              <h2>New Collection</h2>
              <p className="admin-section-subtitle">Create a new photography collection</p>
            </div>
          </header>
          <div className="admin-section-body">
            <CollectionForm />
          </div>
        </section>
      </main>
    </div>
  );
}
