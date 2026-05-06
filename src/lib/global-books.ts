import { supabase } from "@/src/lib/supabase";
import type {
  Book,
  BookWithGlobalBook,
  GlobalBook,
  GlobalBookWithBooks,
  Profile,
  PublishedBookWithOwner,
} from "@/src/types/database";

export async function loadGlobalBooks() {
  const { data: globalBooks, error } = await supabase
    .from("global_books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const globalBookIds = (globalBooks ?? []).map((globalBook) => globalBook.id);
  const booksByGlobalBook = await loadPublishedBooksByGlobalBookId(globalBookIds);

  return (globalBooks ?? []).map((globalBook) =>
    buildGlobalBookWithBooks(globalBook, booksByGlobalBook.get(globalBook.id) ?? []),
  );
}

export async function loadGlobalBook(globalBookId: string) {
  const { data: globalBook, error } = await supabase
    .from("global_books")
    .select("*")
    .eq("id", globalBookId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!globalBook) {
    return null;
  }

  const booksByGlobalBook = await loadPublishedBooksByGlobalBookId([globalBookId]);

  return buildGlobalBookWithBooks(
    globalBook,
    booksByGlobalBook.get(globalBookId) ?? [],
  );
}

export async function loadBooksWithGlobalBooks(ownerId: string) {
  const { data: books, error } = await supabase
    .from("books")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const globalBookIds = Array.from(
    new Set(
      (books ?? [])
        .map((book) => book.global_book_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const globalBooksById = await loadGlobalBooksById(globalBookIds);

  return (books ?? []).map((book) => ({
    ...book,
    global_book: book.global_book_id
      ? globalBooksById.get(book.global_book_id) ?? null
      : null,
  })) satisfies BookWithGlobalBook[];
}

async function loadPublishedBooksByGlobalBookId(globalBookIds: string[]) {
  if (!globalBookIds.length) {
    return new Map<string, PublishedBookWithOwner[]>();
  }

  const { data: books, error } = await supabase
    .from("books")
    .select("*")
    .in("global_book_id", globalBookIds)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const ownerIds = Array.from(
    new Set((books ?? []).map((book) => book.owner_id).filter(Boolean)),
  );

  const ownersById = await loadProfilesById(ownerIds);
  const booksByGlobalBook = new Map<string, PublishedBookWithOwner[]>();

  for (const book of books ?? []) {
    if (!book.global_book_id) {
      continue;
    }

    const entry = booksByGlobalBook.get(book.global_book_id) ?? [];
    entry.push({
      ...book,
      owner: ownersById.get(book.owner_id) ?? null,
    });
    booksByGlobalBook.set(book.global_book_id, entry);
  }

  return booksByGlobalBook;
}

async function loadGlobalBooksById(globalBookIds: string[]) {
  if (!globalBookIds.length) {
    return new Map<string, GlobalBook>();
  }

  const { data, error } = await supabase
    .from("global_books")
    .select("*")
    .in("id", globalBookIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((globalBook) => [globalBook.id, globalBook]));
}

async function loadProfilesById(profileIds: string[]) {
  if (!profileIds.length) {
    return new Map<string, Profile>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", profileIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

function buildGlobalBookWithBooks(
  globalBook: GlobalBook,
  books: PublishedBookWithOwner[],
): GlobalBookWithBooks {
  return {
    ...globalBook,
    books,
    published_books_count: books.length,
    display_cover_path: globalBook.cover_path ?? books[0]?.cover_path ?? null,
  };
}

export async function createGlobalBook(input: {
  title: string;
  author: string;
  editorial?: string;
  description?: string;
  cover_path?: string | null;
  created_by?: string | null;
}) {
  const { data, error } = await supabase
    .from("global_books")
    .insert({
      title: input.title.trim(),
      author: input.author.trim(),
      editorial: input.editorial?.trim() || null,
      description: input.description?.trim() || null,
      cover_path: input.cover_path ?? null,
      created_by: input.created_by ?? null,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Topic was created, but no row was returned.");
  }

  return data;
}

export function matchesGlobalBookQuery(globalBook: GlobalBook, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return (
    globalBook.title.toLowerCase().includes(normalizedQuery) ||
    globalBook.author.toLowerCase().includes(normalizedQuery)
  );
}

export function matchesGlobalBookOption(
  globalBook: GlobalBook,
  query: string,
  fallbackBook?: Pick<Book, "title" | "author"> | null,
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return (
    globalBook.title.toLowerCase().includes(normalizedQuery) ||
    globalBook.author.toLowerCase().includes(normalizedQuery) ||
    fallbackBook?.title?.toLowerCase().includes(normalizedQuery) === true ||
    fallbackBook?.author?.toLowerCase().includes(normalizedQuery) === true
  );
}
