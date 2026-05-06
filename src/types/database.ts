export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BookCondition = "new" | "like_new" | "good" | "fair" | "poor";
export type TradeRequestStatus = "pending" | "accepted" | "declined";
export type DiscussionCommentInsert = {
  discussion_id: string;
  body: string;
  parent_comment_id?: string | null;
  reply_to_comment_id?: string | null;
  reply_to_user_id?: string | null;
};

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
          global_book_id: string | null;
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
          global_book_id?: string | null;
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
          global_book_id?: string | null;
          is_published?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "books_global_book_id_fkey";
            columns: ["global_book_id"];
            referencedRelation: "global_books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "books_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      global_books: {
        Row: {
          id: string;
          title: string;
          author: string;
          editorial: string | null;
          description: string | null;
          cover_path: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          author: string;
          editorial?: string | null;
          description?: string | null;
          cover_path?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          author?: string;
          editorial?: string | null;
          description?: string | null;
          cover_path?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "global_books_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      global_book_discussions: {
        Row: {
          id: string;
          global_book_id: string;
          author_id: string | null;
          title: string | null;
          body: string | null;
          is_deleted: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          global_book_id: string;
          author_id?: string | null;
          title: string;
          body: string;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          body?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "global_book_discussions_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "global_book_discussions_global_book_id_fkey";
            columns: ["global_book_id"];
            referencedRelation: "global_books";
            referencedColumns: ["id"];
          },
        ];
      };
      discussion_comments: {
        Row: {
          id: string;
          discussion_id: string;
          author_id: string | null;
          parent_comment_id: string | null;
          reply_to_comment_id: string | null;
          reply_to_user_id: string | null;
          body: string | null;
          is_deleted: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          author_id?: string | null;
          parent_comment_id?: string | null;
          reply_to_comment_id?: string | null;
          reply_to_user_id?: string | null;
          body: string;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          parent_comment_id?: string | null;
          reply_to_comment_id?: string | null;
          reply_to_user_id?: string | null;
          body?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discussion_comments_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discussion_comments_discussion_id_fkey";
            columns: ["discussion_id"];
            referencedRelation: "global_book_discussions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discussion_comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            referencedRelation: "discussion_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discussion_comments_reply_to_comment_id_fkey";
            columns: ["reply_to_comment_id"];
            referencedRelation: "discussion_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discussion_comments_reply_to_user_id_fkey";
            columns: ["reply_to_user_id"];
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
export type GlobalBook = Database["public"]["Tables"]["global_books"]["Row"];
export type GlobalBookInsert =
  Database["public"]["Tables"]["global_books"]["Insert"];
export type GlobalBookUpdate =
  Database["public"]["Tables"]["global_books"]["Update"];
export type GlobalBookDiscussion =
  Database["public"]["Tables"]["global_book_discussions"]["Row"];
export type GlobalBookDiscussionInsert =
  Database["public"]["Tables"]["global_book_discussions"]["Insert"];
export type GlobalBookDiscussionUpdate =
  Database["public"]["Tables"]["global_book_discussions"]["Update"];
export type DiscussionComment =
  Database["public"]["Tables"]["discussion_comments"]["Row"];
export type TradeRequest =
  Database["public"]["Tables"]["trade_requests"]["Row"];

export type BookWithGlobalBook = Book & {
  global_book?: GlobalBook | null;
};

export type PublishedBookWithOwner = Book & {
  owner?: Profile | null;
};

export type GlobalBookWithBooks = GlobalBook & {
  books: PublishedBookWithOwner[];
  published_books_count: number;
  display_cover_path: string | null;
};

export type DiscussionCommentWithAuthor = DiscussionComment & {
  author?: Profile | null;
  reply_to_user?: Profile | null;
};

export type DiscussionCommentNode = DiscussionCommentWithAuthor & {
  child_count: number;
};

export type GlobalBookDiscussionPreview = GlobalBookDiscussion & {
  author?: Profile | null;
  comment_count: number;
  latest_comment_at: string | null;
};

export type GlobalBookDiscussionWithComments = GlobalBookDiscussion & {
  author?: Profile | null;
  global_book?: GlobalBook | null;
  comment_count: number;
  root_comments: DiscussionCommentNode[];
};

export type DiscussionCommentThread = {
  discussion: GlobalBookDiscussionWithComments;
  ancestor_comments: DiscussionCommentNode[];
  focused_comment: DiscussionCommentNode;
  child_comments: DiscussionCommentNode[];
};
