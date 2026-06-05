import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set."
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: { persistSession: false },
  }
);

export type Photo = Database["public"]["Tables"]["photos"]["Row"];
export type Collection = Database["public"]["Tables"]["collections"]["Row"];

export function getPhotoPublicUrl(storagePath: string): string {
  return supabase.storage.from("photos").getPublicUrl(storagePath).data.publicUrl;
}
