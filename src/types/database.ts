export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BookCondition = "new" | "like_new" | "good" | "fair" | "poor";
export type TradeRequestStatus = "pending" | "accepted" | "declined";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_path: string | null;
          city: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_path?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_path?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          author: string;
          description: string | null;
          condition: BookCondition;
          cover_path: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          title: string;
          author: string;
          description?: string | null;
          condition?: BookCondition;
          cover_path?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          author?: string;
          description?: string | null;
          condition?: BookCondition;
          cover_path?: string | null;
          is_published?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "books_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trade_requests: {
        Row: {
          id: string;
          target_book_id: string;
          offered_book_id: string;
          requester_id: string;
          owner_id: string;
          status: TradeRequestStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          target_book_id: string;
          offered_book_id: string;
          requester_id: string;
          owner_id: string;
          status?: TradeRequestStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: TradeRequestStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trade_requests_target_book_id_fkey";
            columns: ["target_book_id"];
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trade_requests_offered_book_id_fkey";
            columns: ["offered_book_id"];
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trade_requests_requester_id_fkey";
            columns: ["requester_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trade_requests_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      book_condition: BookCondition;
      trade_request_status: TradeRequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Book = Database["public"]["Tables"]["books"]["Row"];
export type BookInsert = Database["public"]["Tables"]["books"]["Insert"];
export type BookUpdate = Database["public"]["Tables"]["books"]["Update"];
export type TradeRequest =
  Database["public"]["Tables"]["trade_requests"]["Row"];
