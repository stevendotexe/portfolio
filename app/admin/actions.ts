"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as never, error: "Not authenticated." };
  return { supabase, user, error: null };
}

export async function createCollectionAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user, error } = await requireUser();
  if (error) return { ok: false, error };
  void user;

  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const dateTaken = String(formData.get("date_taken") ?? "").trim();
  const publish = formData.get("publish") === "on";

  if (!title) return { ok: false, error: "Title is required." };

  const slug = slugify(slugInput || title);
  if (!slug) return { ok: false, error: "Could not derive a valid slug." };

  const { error: insertErr } = await supabase.from("collections").insert({
    slug,
    title,
    description: description || null,
    location: location || null,
    date_taken: dateTaken || null,
    is_published: publish,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return { ok: false, error: `Slug "${slug}" is already taken.` };
    }
    return { ok: false, error: insertErr.message };
  }

  revalidatePath("/admin");
  revalidatePath("/photography");
  return { ok: true };
}

export async function toggleCollectionPublishedAction(
  collectionId: string,
  nextPublished: boolean
): Promise<ActionResult> {
  const { supabase, user, error } = await requireUser();
  if (error) return { ok: false, error };
  void user;

  const { error: updateErr } = await supabase
    .from("collections")
    .update({ is_published: nextPublished })
    .eq("id", collectionId);

  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/admin");
  revalidatePath("/photography");
  return { ok: true };
}

export async function getNextPhotoOrderAction(
  collectionId: string
): Promise<{ ok: true; nextOrder: number } | { ok: false; error: string }> {
  const { supabase, user, error } = await requireUser();
  if (error) return { ok: false, error };
  void user;

  const { data, error: queryErr } = await supabase
    .from("photos")
    .select("display_order")
    .eq("collection_id", collectionId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (queryErr) return { ok: false, error: queryErr.message };

  return { ok: true, nextOrder: (data?.display_order ?? 0) + 1 };
}

export async function revalidatePhotographyAction() {
  revalidatePath("/photography");
  revalidatePath("/admin");
}

export async function setCollectionCoverPhotoAction(
  collectionId: string,
  photoId: string | null
): Promise<ActionResult> {
  const { supabase, user, error } = await requireUser();
  if (error) return { ok: false, error };
  void user;

  const { error: updateErr } = await supabase
    .from("collections")
    .update({ cover_photo_id: photoId })
    .eq("id", collectionId);

  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/admin");
  revalidatePath("/photography");
  return { ok: true };
}

export async function deletePhotoAction(
  photoId: string,
  storagePath: string
): Promise<ActionResult> {
  const { supabase, user, error } = await requireUser();
  if (error) return { ok: false, error };
  void user;

  // 1. Unset cover_photo_id to prevent foreign key errors
  const { data: collections } = await supabase
    .from("collections")
    .select("id")
    .eq("cover_photo_id", photoId);

  if (collections && collections.length > 0) {
    for (const col of collections) {
      await supabase
        .from("collections")
        .update({ cover_photo_id: null })
        .eq("id", col.id);
    }
  }

  // 2. Delete file from storage
  const { error: storageErr } = await supabase.storage
    .from("photos")
    .remove([storagePath]);

  if (storageErr) {
    console.error("Storage delete warning:", storageErr.message);
  }

  // 3. Delete row from DB
  const { error: deleteErr } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId);

  if (deleteErr) return { ok: false, error: deleteErr.message };

  revalidatePath("/admin");
  revalidatePath("/photography");
  return { ok: true };
}

export async function updatePhotoOrderAction(
  photoId: string,
  displayOrder: number
): Promise<ActionResult> {
  const { supabase, user, error } = await requireUser();
  if (error) return { ok: false, error };
  void user;

  const { error: updateErr } = await supabase
    .from("photos")
    .update({ display_order: displayOrder })
    .eq("id", photoId);

  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/admin");
  revalidatePath("/photography");
  return { ok: true };
}
