import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { resolveCoverSource } from "@/src/lib/book-covers";
import { loadGlobalBooks } from "@/src/lib/global-books";
import type { GlobalBookWithBooks } from "@/src/types/database";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

export function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { navigateToScreen } = useAppNavigation();
  const [search, setSearch] = useState("");
  const [globalBooks, setGlobalBooks] = useState<GlobalBookWithBooks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCatalog = React.useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await loadGlobalBooks();
      setGlobalBooks(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load topics.",
      );
      setGlobalBooks([]);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCatalog(false);
  };

  const filteredGlobalBooks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return globalBooks;
    }

    return globalBooks.filter((globalBook) => {
      return (
        globalBook.title.toLowerCase().includes(query) ||
        globalBook.author.toLowerCase().includes(query)
      );
    });
  }, [globalBooks, search]);

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
            placeholder="Search topics..."
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
            <ThemedText type="subtitle">Topics near you</ThemedText>
            <ThemedText style={{ color: colors.tabIconDefault }}>
              Showing {globalBooks.length} catalog entries
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
            Catalog
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.cardsContainer}>
          {isLoading ? (
            <ThemedView style={styles.feedbackState}>
              <ActivityIndicator color={colors.tint} />
              <ThemedText style={{ color: colors.tabIconDefault }}>
                Loading topics...
              </ThemedText>
            </ThemedView>
          ) : errorMessage ? (
            <ThemedView style={styles.feedbackState}>
              <ThemedText type="defaultSemiBold">
                Could not load topics
              </ThemedText>
              <ThemedText
                style={[styles.feedbackText, { color: colors.tabIconDefault }]}
              >
                {errorMessage}
              </ThemedText>
              <Pressable
                onPress={() => loadCatalog()}
                style={[styles.feedbackButton, { backgroundColor: colors.tint }]}
              >
                <ThemedText style={styles.feedbackButtonText}>Try again</ThemedText>
              </Pressable>
            </ThemedView>
          ) : filteredGlobalBooks.length === 0 ? (
            <ThemedView style={styles.feedbackState}>
              <ThemedText type="defaultSemiBold">
                {globalBooks.length === 0
                  ? "No topics available yet"
                  : "No matches found"}
              </ThemedText>
              <ThemedText
                style={[styles.feedbackText, { color: colors.tabIconDefault }]}
              >
                {globalBooks.length === 0
                  ? "Topics will show up here once readers create them."
                  : "Try another title or author."}
              </ThemedText>
            </ThemedView>
          ) : (
            filteredGlobalBooks.map((globalBook) => (
              <TouchableOpacity
                key={globalBook.id}
                onPress={() =>
                  navigateToScreen("home", "global-book", {
                    globalBookId: globalBook.id,
                  })
                }
                style={styles.bookCard}
              >
                <Image
                  source={resolveCoverSource({
                    cover_path: globalBook.display_cover_path,
                  })}
                  style={styles.bookCover}
                  contentFit="cover"
                  transition={400}
                />
                <ThemedView style={styles.bookInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.titleText}>
                    {globalBook.title}
                  </ThemedText>
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    {globalBook.author}
                  </ThemedText>
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    {globalBook.editorial || "Editorial not added yet"}
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
                      {globalBook.published_books_count} published
                      {globalBook.published_books_count === 1 ? " book" : " books"}
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
