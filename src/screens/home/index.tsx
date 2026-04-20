import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import type { Book } from "@/src/types/database";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

const NO_COVER_IMAGE = require("../../../assets/images/no-cover-available.png");

export function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { navigateToScreen } = useAppNavigation();
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPublishedBooks = React.useCallback(
    async (showSpinner = true) => {
      if (showSpinner) {
        setIsLoading(true);
      }
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
        setBooks([]);
      } else {
        setBooks(data ?? []);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    loadPublishedBooks();
  }, [loadPublishedBooks]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPublishedBooks(false);
  };

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return books;
    }

    return books.filter((book) => {
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    });
  }, [books, search]);

  const getCoverSource = (book: Book) => {
    if (book.cover_path?.startsWith("http")) {
      return book.cover_path;
    }

    if (book.cover_path) {
      const { data } = supabase.storage
        .from("book-covers")
        .getPublicUrl(book.cover_path);
      return data.publicUrl;
    }

    return NO_COVER_IMAGE;
  };

  return (
    <ThemedView style={styles.container}>

      <ThemedView style={styles.fixedHeader}>
        <ThemedText type="title" style={styles.logoText}>
          BookTrade
        </ThemedText>
        <ThemedView
          style={[
            styles.searchContainer,
            {
              backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
            },
          ]}
        >
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search published books..."
            placeholderTextColor={colors.tabIconDefault}
            value={search}
            onChangeText={setSearch}
          />
        </ThemedView>
      </ThemedView>

      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={colors.tint}
            onRefresh={handleRefresh}
          />
        }
      >
        <ThemedView style={styles.mapSection}>
          <ThemedView
            style={[
              styles.mapPlaceholder,
              {
                backgroundColor: colors.tint + "10",
                borderColor: colors.tint + "30",
              },
            ]}
          >
            <ThemedText style={styles.mapPin}>Pin</ThemedText>
            <ThemedText type="subtitle">Books near you</ThemedText>
            <ThemedText style={{ color: colors.tabIconDefault }}>
              Showing {books.length} active trades
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView
          style={[
            styles.stickyHeaderWrapper,
            { backgroundColor: colors.background },
          ]}
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recommended for you
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.cardsContainer}>
          {isLoading ? (
            <ThemedView style={styles.feedbackState}>
              <ActivityIndicator color={colors.tint} />
              <ThemedText style={{ color: colors.tabIconDefault }}>
                Loading published books...
              </ThemedText>
            </ThemedView>
          ) : errorMessage ? (
            <ThemedView style={styles.feedbackState}>
              <ThemedText type="defaultSemiBold">Could not load books</ThemedText>
              <ThemedText
                style={[styles.feedbackText, { color: colors.tabIconDefault }]}
              >
                {errorMessage}
              </ThemedText>
              <Pressable
                onPress={() => loadPublishedBooks()}
                style={[styles.feedbackButton, { backgroundColor: colors.tint }]}
              >
                <ThemedText style={styles.feedbackButtonText}>Try again</ThemedText>
              </Pressable>
            </ThemedView>
          ) : filteredBooks.length === 0 ? (
            <ThemedView style={styles.feedbackState}>
              <ThemedText type="defaultSemiBold">
                {books.length === 0 ? "No books available yet" : "No matches found"}
              </ThemedText>
              <ThemedText
                style={[styles.feedbackText, { color: colors.tabIconDefault }]}
              >
                {books.length === 0
                  ? "When people publish books, they will show up here."
                  : "Try another title or author."}
              </ThemedText>
            </ThemedView>
          ) : (
            filteredBooks.map((book) => (
              <TouchableOpacity
                key={book.id}
                onPress={() =>
                  navigateToScreen("home", "book", { bookId: book.id })
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
                      transition={400}
                    />
                  );
                })()}
                <ThemedView style={styles.bookInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.titleText}>
                    {book.title}
                  </ThemedText>
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    {book.author}
                  </ThemedText>

                  <ThemedView
                    style={[
                      styles.badge,
                      { backgroundColor: colors.tint + "15" },
                    ]}
                  >
                    <ThemedText
                      style={{
                        color: colors.tint,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      Available for trade
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </TouchableOpacity>
            ))
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 12,
    alignItems: "center",
    paddingBottom: 10,
  },
  logoText: {
    fontSize: 28,
    color: "#E91E63",
    fontWeight: "900",
  },
  searchContainer: {
    height: 45,
    borderRadius: 12,
    paddingHorizontal: 15,
    justifyContent: "center",
    alignSelf: "stretch",
  },
  cardsContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  searchInput: {
    fontSize: 16,
  },
  mapSection: {
    padding: 20,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  mapPin: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 5,
  },
  stickyHeaderWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 5,
    width: "100%",
  },
  sectionTitle: {
    marginBottom: 0,
  },
  bookCard: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
    gap: 15,
  },
  bookCover: {
    width: 90,
    height: 130,
    borderRadius: 12,
  },
  bookInfo: {
    flex: 1,
    gap: 2,
  },
  feedbackState: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 36,
    width: "100%",
  },
  feedbackText: {
    textAlign: "center",
  },
  feedbackButton: {
    alignItems: "center",
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  feedbackButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  titleText: {
    fontSize: 18,
  },
  badge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
});
