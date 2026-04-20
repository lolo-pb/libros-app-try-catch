import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import type { Book } from "@/src/types/database";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NO_COVER_IMAGE = require("../../../assets/images/no-cover-available.png");

export function MyBooksScreen() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const { navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBooks = useCallback(async (showSpinner = true) => {
    if (!session) {
      setBooks([]);
      return;
    }

    if (showSpinner) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setBooks(data ?? []);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [session]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadBooks(false);
  };

  const handleTogglePublished = async (book: Book) => {
    const { error } = await supabase
      .from("books")
      .update({ is_published: !book.is_published })
      .eq("id", book.id);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setBooks((current) =>
        current.map((item) =>
          item.id === book.id
            ? { ...item, is_published: !item.is_published }
            : item,
        ),
      );
    }
  };

  const getCoverSource = (book: Book) => {
    if (book.cover_path?.startsWith("http")) {
      return book.cover_path;
    }

    if (book.cover_path) {
      return supabase.storage.from("book-covers").getPublicUrl(book.cover_path)
        .data.publicUrl;
    }

    return NO_COVER_IMAGE;
  };

  if (isAuthLoading) {
    return (
      <ThemedView style={styles.centerState}>
        <ActivityIndicator color={colors.tint} />
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ThemedView style={styles.container}>
          <ThemedText type="title">My Books</ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Sign in to add books and decide which ones are published.
          </ThemedText>
          <Pressable
            onPress={() => navigateToScreen("user", "login")}
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.primaryButtonText}>Go to Login</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={colors.tint}
            onRefresh={handleRefresh}
          />
        }
      >
        <ThemedView style={styles.headerRow}>
          <ThemedView style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              My Books
            </ThemedText>
            <ThemedText style={{ color: colors.tabIconDefault }}>
              Your private shelf and published trades.
            </ThemedText>
          </ThemedView>
          <Pressable
            onPress={() => navigateToScreen("books", "new-book")}
            style={[styles.addButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.addButtonText}>New</ThemedText>
          </Pressable>
        </ThemedView>

        {errorMessage ? (
          <ThemedView style={styles.errorBox}>
            <ThemedText type="defaultSemiBold">Could not load your books</ThemedText>
            <ThemedText style={[styles.errorText, { color: colors.tabIconDefault }]}>
              {errorMessage}
            </ThemedText>
            <Pressable
              onPress={() => loadBooks()}
              style={[styles.retryButton, { backgroundColor: colors.tint }]}
            >
              <ThemedText style={styles.retryButtonText}>Try again</ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
          </ThemedView>
        ) : books.length === 0 ? (
          <ThemedView style={styles.emptyBox}>
            <ThemedText type="defaultSemiBold">No books yet</ThemedText>
            <ThemedText style={{ color: colors.tabIconDefault }}>
              Add your first book to start trading.
            </ThemedText>
            <Pressable
              onPress={() => navigateToScreen("books", "new-book")}
              style={[styles.emptyButton, { backgroundColor: colors.tint }]}
            >
              <ThemedText style={styles.emptyButtonText}>Add a book</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          books.map((book) => (
            <Pressable
              key={book.id}
              onPress={() =>
                navigateToScreen("books", "book", { bookId: book.id })
              }
              style={styles.bookCard}
            >
              {(() => {
                const coverSource = getCoverSource(book);
                return (
                  <Image
                    source={
                      typeof coverSource === "string"
                        ? { uri: coverSource }
                        : coverSource
                    }
                    style={styles.bookCover}
                    contentFit="cover"
                  />
                );
              })()}
              <ThemedView style={styles.bookInfo}>
                <ThemedText type="defaultSemiBold" style={styles.bookTitle}>
                  {book.title}
                </ThemedText>
                <ThemedText style={{ color: colors.tabIconDefault }}>
                  {book.author}
                </ThemedText>
                <ThemedText style={{ color: colors.tabIconDefault }}>
                  {book.is_published ? "Published" : "Private"}
                </ThemedText>
                <Pressable
                  onPress={() => handleTogglePublished(book)}
                  style={[styles.smallButton, { backgroundColor: colors.tint + "15" }]}
                >
                  <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
                    {book.is_published ? "Unpublish" : "Publish"}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingTop: 40,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    marginBottom: 6,
  },
  helperText: {
    marginBottom: 24,
    marginTop: 14,
  },
  addButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    textAlign: "center",
  },
  errorBox: {
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  retryButton: {
    alignItems: "center",
    borderRadius: 8,
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 50,
  },
  emptyButton: {
    alignItems: "center",
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  bookCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  bookCover: {
    borderRadius: 12,
    height: 130,
    width: 90,
  },
  bookInfo: {
    flex: 1,
    gap: 2,
  },
  bookTitle: {
    fontSize: 18,
  },
  smallButton: {
    alignSelf: "flex-start",
    borderRadius: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
