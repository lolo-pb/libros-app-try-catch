import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { resolveCoverSource } from "@/src/lib/book-covers";
import { loadGlobalBookDiscussions } from "@/src/lib/discussions";
import { getErrorMessage } from "@/src/lib/errors";
import { loadGlobalBook } from "@/src/lib/global-books";
import type {
  GlobalBookDiscussionPreview,
  GlobalBookWithBooks,
} from "@/src/types/database";
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
  const { session } = useAuth();
  const { navigationState, navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const globalBookId = navigationState.params?.globalBookId;
  const [globalBook, setGlobalBook] = useState<GlobalBookWithBooks | null>(null);
  const [discussions, setDiscussions] = useState<GlobalBookDiscussionPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  useEffect(() => {
    let isMounted = true;

    async function fetchGlobalBook() {
      if (!globalBookId) {
        setErrorMessage("No topic selected.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [data, loadedDiscussions] = await Promise.all([
          loadGlobalBook(globalBookId),
          loadGlobalBookDiscussions(globalBookId),
        ]);

        if (!isMounted) {
          return;
        }

        if (!data) {
          setErrorMessage("This topic could not be found.");
        } else {
          setGlobalBook(data);
          setDiscussions(loadedDiscussions);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error, "Could not load this topic."));
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
      <Pressable
        onPress={() => navigateToScreen("home", "home-main")}
        style={[
          styles.backButton,
          { backgroundColor: colorScheme === "dark" ? "#3a3a3acc" : "#e6e6e6cc" },
        ]}
      >
        <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
          Back to Home
        </ThemedText>
      </Pressable>

      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
            <ThemedText style={{ color: colors.tabIconDefault }}>
              Loading topic...
            </ThemedText>
          </ThemedView>
        ) : errorMessage || !globalBook ? (
          <ThemedView style={styles.centerState}>
            <ThemedText type="subtitle">Topic unavailable</ThemedText>
            <ThemedText style={{ color: colors.tabIconDefault }}>
              {errorMessage ?? "This topic could not be found."}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Image
                source={resolveCoverSource({
                  cover_path: globalBook.display_cover_path,
                })}
                style={styles.cover}
                contentFit="cover"
              />
              <View style={styles.headerContent}>
                <ThemedText type="title" style={styles.title}>
                  {globalBook.title}
                </ThemedText>
                <ThemedText style={[styles.author, { color: colors.tabIconDefault }]}>
                  {globalBook.author}
                </ThemedText>
                <ThemedText style={[styles.editorial, { color: colors.tabIconDefault }]}>
                  {globalBook.editorial || "Editorial not added yet"}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.description}>
              {globalBook.description || "No description yet."}
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

            <View style={styles.discussionSection}>
              <ThemedView style={styles.discussionHeader}>
                <ThemedText type="subtitle">Discussions</ThemedText>
                <Pressable
                  onPress={() =>
                    session
                      ? navigateToScreen("home", "new-discussion", {
                        globalBookId: globalBook.id,
                      })
                      : navigateToScreen("user", "login")
                  }
                  style={[styles.startButton, { backgroundColor: colors.tint }]}
                >
                  <ThemedText style={styles.startButtonText}>
                    Start discussion
                  </ThemedText>
                </Pressable>
              </ThemedView>

              {discussions.length === 0 ? (
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
                    No discussions yet
                  </ThemedText>
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    Be the first to talk about this topic.
                  </ThemedText>
                </ThemedView>
              ) : (
                discussions.map((discussion) => (
                  <Pressable
                    key={discussion.id}
                    onPress={() =>
                      navigateToScreen("home", "discussion-detail", {
                        discussionId: discussion.id,
                        globalBookId: globalBook.id,
                      })
                    }
                    style={[
                      styles.discussionCard,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? "#2c2c2e" : "#f8f8f8",
                      },
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">
                      {discussion.is_deleted
                        ? "Deleted discussion"
                        : discussion.title}
                    </ThemedText>
                    <ThemedText style={{ color: colors.tabIconDefault }}>
                      {discussion.author?.display_name ?? "BookTrade reader"} ·{" "}
                      {formatDate(discussion.created_at)}
                    </ThemedText>
                    <ThemedText numberOfLines={2} style={styles.previewText}>
                      {discussion.is_deleted
                        ? "This discussion was deleted."
                        : discussion.body}
                    </ThemedText>
                    <ThemedText style={{ color: colors.tabIconDefault }}>
                      {discussion.comment_count} Repl
                      {discussion.comment_count === 1 ? "y" : "ies"}
                    </ThemedText>
                  </Pressable>
                ))
              )}
            </View>

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
                    Readers can still link new books to this topic later.
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
    paddingTop: 70,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    top: 40,
    left: 20,
    width: 128,
    zIndex: 20,
  },
  centerState: {
    alignItems: "center",
    gap: 10,
    paddingTop: 80,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
  },
  cover: {
    borderRadius: 12,
    height: 188,
    width: 128,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
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
    lineHeight: 21,
    marginTop: 12,
  },
  publicationSection: {
    marginTop: 28,
    gap: 12,
  },
  discussionSection: {
    gap: 12,
    marginTop: 28,
  },
  discussionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  startButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  discussionCard: {
    borderRadius: 12,
    gap: 6,
    padding: 14,
  },
  previewText: {
    marginTop: 2,
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
