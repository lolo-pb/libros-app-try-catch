import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { resolveCoverSource } from "@/src/lib/book-covers";
import { loadGlobalBook } from "@/src/lib/global-books";
import type { GlobalBookWithBooks } from "@/src/types/database";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function GlobalBookScreen() {
  const { navigationState, navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const globalBookId = navigationState.params?.globalBookId;
  const [globalBook, setGlobalBook] = useState<GlobalBookWithBooks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchGlobalBook() {
      if (!globalBookId) {
        setErrorMessage("No global book selected.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await loadGlobalBook(globalBookId);

        if (!isMounted) {
          return;
        }

        if (!data) {
          setErrorMessage("This global book could not be found.");
        } else {
          setGlobalBook(data);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load this global book.",
          );
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    fetchGlobalBook();

    return () => {
      isMounted = false;
    };
  }, [globalBookId]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() => navigateToScreen("home", "home-main")}
          style={[styles.backButton, { backgroundColor: colors.tint + "15" }]}
        >
          <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
            Back to Home
          </ThemedText>
        </Pressable>

        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
            <ThemedText style={{ color: colors.tabIconDefault }}>
              Loading global book...
            </ThemedText>
          </ThemedView>
        ) : errorMessage || !globalBook ? (
          <ThemedView style={styles.centerState}>
            <ThemedText type="subtitle">Global book unavailable</ThemedText>
            <ThemedText style={{ color: colors.tabIconDefault }}>
              {errorMessage ?? "This global book could not be found."}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            <Image
              source={resolveCoverSource({
                cover_path: globalBook.display_cover_path,
              })}
              style={styles.cover}
              contentFit="cover"
            />
            <ThemedText type="title" style={styles.title}>
              {globalBook.title}
            </ThemedText>
            <ThemedText style={[styles.author, { color: colors.tabIconDefault }]}>
              {globalBook.author}
            </ThemedText>
            <ThemedText style={[styles.editorial, { color: colors.tabIconDefault }]}>
              {globalBook.editorial || "Editorial not added yet"}
            </ThemedText>

            <ThemedView style={styles.badgeRow}>
              <ThemedView
                style={[styles.badge, { backgroundColor: colors.tint + "15" }]}
              >
                <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
                  {globalBook.published_books_count} published
                  {globalBook.published_books_count === 1 ? " book" : " books"}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedText style={styles.description}>
              {globalBook.description || "No description yet."}
            </ThemedText>

            <View style={styles.publicationSection}>
              <ThemedText type="subtitle">Published books</ThemedText>
              {globalBook.books.length === 0 ? (
                <ThemedView
                  style={[
                    styles.emptyBox,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#2c2c2e" : "#f6f6f6",
                    },
                  ]}
                >
                  <ThemedText type="defaultSemiBold">
                    No published books yet
                  </ThemedText>
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    Readers can still link new books to this global book later.
                  </ThemedText>
                </ThemedView>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {globalBook.books.map((book) => (
                    <Pressable
                      key={book.id}
                      onPress={() =>
                        navigateToScreen("home", "book", {
                          bookId: book.id,
                          globalBookId: globalBook.id,
                          returnScreen: "global-book",
                        })
                      }
                      style={[
                        styles.bookCard,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#2c2c2e" : "#f8f8f8",
                        },
                      ]}
                    >
                      <Image
                        source={resolveCoverSource(book)}
                        style={styles.bookCover}
                        contentFit="cover"
                      />
                      <ThemedText type="defaultSemiBold" numberOfLines={2}>
                        {book.title}
                      </ThemedText>
                      <ThemedText
                        numberOfLines={1}
                        style={{ color: colors.tabIconDefault }}
                      >
                        {book.owner?.display_name ?? "BookTrade reader"}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          </>
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
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  centerState: {
    alignItems: "center",
    gap: 10,
    paddingTop: 80,
  },
  cover: {
    alignSelf: "center",
    borderRadius: 12,
    height: 310,
    marginBottom: 22,
    width: 210,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
  },
  author: {
    fontSize: 17,
    marginTop: 6,
  },
  editorial: {
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  description: {
    marginTop: 20,
  },
  publicationSection: {
    marginTop: 28,
    gap: 12,
  },
  emptyBox: {
    borderRadius: 12,
    gap: 6,
    padding: 16,
  },
  horizontalList: {
    gap: 12,
    paddingRight: 20,
  },
  bookCard: {
    borderRadius: 14,
    padding: 12,
    width: 160,
    gap: 8,
  },
  bookCover: {
    borderRadius: 10,
    height: 170,
    width: "100%",
  },
});
