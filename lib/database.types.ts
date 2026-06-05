export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      collections: {
        Row: {
          cover_photo_id: string | null;
          created_at: string;
          date_taken: string | null;
          description: string | null;
          display_order: number;
          id: string;
          is_published: boolean;
          location: string | null;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          cover_photo_id?: string | null;
          created_at?: string;
          date_taken?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_published?: boolean;
          location?: string | null;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          cover_photo_id?: string | null;
          created_at?: string;
          date_taken?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_published?: boolean;
          location?: string | null;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_cover_photo_fk";
            columns: ["cover_photo_id"];
            isOneToOne: false;
            referencedRelation: "photos";
            referencedColumns: ["id"];
          },
        ];
      };
      photos: {
        Row: {
          alt_text: string | null;
          aperture: string | null;
          camera: string | null;
          caption: string | null;
          collection_id: string | null;
          created_at: string;
          display_order: number;
          focal_length: string | null;
          height: number | null;
          id: string;
          is_published: boolean;
          iso: number | null;
          lens: string | null;
          location: string | null;
          shutter_speed: string | null;
          storage_path: string;
          tags: string[] | null;
          taken_at: string | null;
          title: string | null;
          updated_at: string;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          aperture?: string | null;
          camera?: string | null;
          caption?: string | null;
          collection_id?: string | null;
          created_at?: string;
          display_order?: number;
          focal_length?: string | null;
          height?: number | null;
          id?: string;
          is_published?: boolean;
          iso?: number | null;
          lens?: string | null;
          location?: string | null;
          shutter_speed?: string | null;
          storage_path: string;
          tags?: string[] | null;
          taken_at?: string | null;
          title?: string | null;
          updated_at?: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          aperture?: string | null;
          camera?: string | null;
          caption?: string | null;
          collection_id?: string | null;
          created_at?: string;
          display_order?: number;
          focal_length?: string | null;
          height?: number | null;
          id?: string;
          is_published?: boolean;
          iso?: number | null;
          lens?: string | null;
          location?: string | null;
          shutter_speed?: string | null;
          storage_path?: string;
          tags?: string[] | null;
          taken_at?: string | null;
          title?: string | null;
          updated_at?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "photos_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
