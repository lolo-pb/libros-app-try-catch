import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { resolveCoverSource } from "@/src/lib/book-covers";
import { removeBookCover } from "@/src/lib/book-storage";
import { supabase } from "@/src/lib/supabase";
import type { Book, GlobalBook, Profile } from "@/src/types/database";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function BookScreen() {
  const { navigationState, navigateToScreen } = useAppNavigation();
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const bookId = navigationState.params?.bookId;
  const relatedGlobalBookId = navigationState.params?.globalBookId;
  const returnScreen = navigationState.params?.returnScreen;
  const backSection = navigationState.currentSection === "books" ? "books" : "home";
  const backScreen =
    backSection === "books"
      ? "my-books"
      : returnScreen === "global-book" && relatedGlobalBookId
        ? "global-book"
        : "home-main";
  const backLabel =
    backSection === "books"
      ? "Back to My Books"
      : returnScreen === "global-book" && relatedGlobalBookId
        ? "Back to Topic"
        : "Back to Home";
  const [book, setBook] = useState<Book | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [globalBook, setGlobalBook] = useState<GlobalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isOwner = Boolean(session?.user.id && book?.owner_id === session.user.id);
  const ownerAvatarUrl = owner?.avatar_path?.startsWith("http")
    ? owner.avatar_path
    : owner?.avatar_path
      ? supabase.storage.from("avatars").getPublicUrl(owner.avatar_path).data.publicUrl
      : null;

  useEffect(() => {
    let isMounted = true;

    async function loadBook() {
      if (!bookId) {
        setIsLoading(false);
        setErrorMessage("No book selected.");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setBook(data);

      const ownerId = data?.owner_id;
      const nextGlobalBookId = data?.global_book_id;

      const [ownerResult, globalBookResult] = await Promise.all([
        ownerId
          ? supabase.from("profiles").select("*").eq("id", ownerId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        nextGlobalBookId
          ? supabase
              .from("global_books")
              .select("*")
              .eq("id", nextGlobalBookId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (!isMounted) {
        return;
      }

      setOwner(ownerResult.data ?? null);
      setGlobalBook(globalBookResult.data ?? null);
      setIsLoading(false);
    }

    loadBook();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  const deleteBook = async () => {
    if (!book || !isOwner) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    const { error } = await supabase.from("books").delete().eq("id", book.id);

    if (error) {
      setErrorMessage(error.message);
      setIsDeleting(false);
      return;
    }

    await removeBookCover(book.cover_path);
    navigateToScreen("books", "my-books");
    setIsDeleting(false);
  };

  const handleToggleAvailability = async () => {
    if (!book || !isOwner) {
      return;
    }

    const previousBook = book;
    const nextPublished = !book.is_published;
    setBook({ ...book, is_published: nextPublished });
    setErrorMessage(null);

    const { error } = await supabase
      .from("books")
      .update({ is_published: nextPublished })
      .eq("id", book.id);

    if (error) {
      setBook(previousBook);
      setErrorMessage(error.message);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web" && typeof window.confirm === "function") {
      const confirmed = window.confirm("Delete this book from your shelf?");

      if (confirmed) {
        deleteBook();
      }
      return;
    }

    Alert.alert("Delete book?", "This removes the book from your shelf.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteBook },
    ]);
  };

  const handleRequestTrade = () => {
    if (!session) {
      navigateToScreen("user", "login");
      return;
    }

    if (!book) {
      return;
    }

    navigateToScreen("home", "select-trade-book", {
      targetBookId: book.id,
      globalBookId: book.global_book_id ?? undefined,
    });
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() =>
            navigateToScreen(backSection, backScreen, {
              globalBookId: relatedGlobalBookId,
            })
          }
          style={[styles.backButton, { backgroundColor: colors.tint + "15" }]}
        >
          <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
            {backLabel}
          </ThemedText>
        </Pressable>

        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
            <ThemedText style={{ color: colors.tabIconDefault }}>
              Loading book...
            </ThemedText>
          </ThemedView>
        ) : errorMessage || !book ? (
          <ThemedView style={styles.centerState}>
            <ThemedText type="subtitle">Book unavailable</ThemedText>
            <ThemedText style={{ color: colors.tabIconDefault }}>
              {errorMessage ?? "This book could not be found."}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Image
                source={resolveCoverSource(book)}
                style={styles.cover}
                contentFit="cover"
              />
              <View style={styles.headerContent}>
                <ThemedText type="title" style={styles.title}>
                  {book.title}
                </ThemedText>
                <ThemedText style={[styles.author, { color: colors.tabIconDefault }]}>
                  {book.author}
                </ThemedText>
                <ThemedText style={[styles.metaText, { color: colors.tabIconDefault }]}>
                  Published by {owner?.display_name ?? "BookTrade reader"}
                </ThemedText>
              </View>
            </View>

            <ThemedView style={styles.badgeRow}>
              <ThemedView
                style={[styles.badge, { backgroundColor: colors.tint + "15" }]}
              >
                <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
                  {book.condition.replace("_", " ")} condition
                </ThemedText>
              </ThemedView>
              <Pressable
                disabled={!isOwner}
                onPress={handleToggleAvailability}
                style={[
                  styles.badge,
                  isOwner ? styles.toggleBadge : null,
                  book.is_published
                    ? {
                        backgroundColor: colors.tint + "15",
                        borderColor: colors.tint,
                      }
                    : {
                        backgroundColor: "#d6454518",
                        borderColor: "#d64545",
                      },
                ]}
              >
                <ThemedText
                  style={{
                    color: book.is_published ? colors.tint : "#d64545",
                    fontWeight: "700",
                  }}
                >
                  {book.is_published ? "Available" : "Unavailable"}
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedView
              style={[
                styles.infoBox,
                {
                  backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f8f8f8",
                },
              ]}
            >
              <ThemedText type="defaultSemiBold">Description:</ThemedText>
              <ThemedText style={[styles.description, { color: colors.tabIconDefault }]}>
                {book.description || "No description yet."}
              </ThemedText>
            </ThemedView>

            <ThemedView
              style={[
                styles.publisherBox,
                {
                  backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f8f8f8",
                },
              ]}
            >
              <ThemedText type="defaultSemiBold">Published by:</ThemedText>
              <View style={styles.publisherCard}>
                <View style={[styles.publisherAvatar, { backgroundColor: colors.tint + "20" }]}>
                  {ownerAvatarUrl ? (
                    <Image
                      source={{ uri: ownerAvatarUrl }}
                      style={styles.publisherAvatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <ThemedText style={[styles.publisherAvatarText, { color: colors.tint }]}>
                      {(owner?.display_name ?? "B").slice(0, 1)}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.publisherRow}>
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    {owner?.display_name ?? "BookTrade reader"}
                  </ThemedText>
                  {owner?.email ? (
                    <ThemedText style={{ color: colors.tabIconDefault }}>
                      {owner.email}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            </ThemedView>

            {globalBook ? (
              <>
                <View style={styles.topicSection}>
                  <ThemedText type="subtitle">Global topic</ThemedText>
                  <Pressable
                    onPress={() =>
                      navigateToScreen("home", "global-book", {
                        globalBookId: globalBook.id,
                      })
                    }
                    style={[
                      styles.topicCard,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? "#2c2c2e" : "#f8f8f8",
                      },
                    ]}
                  >
                    <View style={styles.topicContent}>
                      <ThemedText type="defaultSemiBold" style={styles.topicTitle}>
                        {globalBook.title}
                      </ThemedText>
                      <ThemedText style={{ color: colors.tabIconDefault }}>
                        {globalBook.author}
                      </ThemedText>
                      <ThemedText style={{ color: colors.tabIconDefault }}>
                        {globalBook.editorial || "Editorial not added yet"}
                      </ThemedText>
                    </View>
                    <Image
                      source={resolveCoverSource(globalBook)}
                      style={styles.topicCover}
                      contentFit="cover"
                    />
                  </Pressable>
                </View>
              </>
            ) : null}

            {isOwner ? (
              <>
                <ThemedView style={styles.ownerActions}>
                  <Pressable
                    onPress={() =>
                      navigateToScreen(backSection, "edit-book", {
                        bookId: book.id,
                        returnSection: backSection,
                        returnScreen,
                        globalBookId: globalBook?.id ?? relatedGlobalBookId,
                      })
                    }
                    style={[styles.ownerButton, { backgroundColor: colors.tint }]}
                  >
                    <ThemedText style={styles.ownerButtonText}>Edit book</ThemedText>
                  </Pressable>
                  <Pressable
                    disabled={isDeleting}
                    onPress={handleDelete}
                    style={[
                      styles.ownerButton,
                      styles.deleteButton,
                      { borderColor: colors.icon },
                    ]}
                  >
                    {isDeleting ? (
                      <ActivityIndicator color={colors.tint} />
                    ) : (
                      <ThemedText type="defaultSemiBold">Delete book</ThemedText>
                    )}
                  </Pressable>
                </ThemedView>
              </>
            ) : (
              <>
              <Pressable
                onPress={handleRequestTrade}
                style={[styles.tradeButton, { backgroundColor: "#E91E63" }]}
              >
                <ThemedText style={styles.tradeButtonText}>Request trade</ThemedText>
              </Pressable>
              </>
            )}
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
  metaText: {
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  badge: {
    alignSelf: "flex-start",
    alignItems: "center",
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toggleBadge: {
    borderWidth: 1,
  },
  infoBox: {
    borderRadius: 12,
    gap: 8,
    marginTop: 18,
    padding: 16,
  },
  description: {
    lineHeight: 21,
  },
  publisherCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  publisherBox: {
    borderRadius: 12,
    gap: 10,
    marginTop: 12,
    padding: 16,
  },
  publisherAvatar: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    width: 44,
  },
  publisherAvatarImage: {
    height: "100%",
    width: "100%",
  },
  publisherAvatarText: {
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  publisherRow: {
    gap: 4,
  },
  topicSection: {
    gap: 12,
    marginTop: 28,
  },
  topicCard: {
    borderRadius: 14,
    flexDirection: "row",
    gap: 14,
    padding: 14,
  },
  topicCover: {
    borderRadius: 10,
    height: 110,
    width: 76,
  },
  topicContent: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  topicTitle: {
    fontSize: 18,
  },
  tradeButton: {
    alignItems: "center",
    borderRadius: 8,
    marginTop: 28,
    paddingVertical: 14,
  },
  tradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  ownerActions: {
    gap: 12,
    marginTop: 28,
  },
  ownerButton: {
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
  },
  ownerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
});
