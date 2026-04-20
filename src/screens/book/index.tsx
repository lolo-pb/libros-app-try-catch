import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import type { Book, Profile } from "@/src/types/database";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NO_COVER_IMAGE = require("../../../assets/images/no-cover-available.png");

export function BookScreen() {
  const { navigationState, navigateToScreen } = useAppNavigation();
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const bookId = navigationState.params?.bookId;
  const backSection = navigationState.currentSection === "books" ? "books" : "home";
  const backScreen = backSection === "books" ? "my-books" : "home-main";
  const backLabel = backSection === "books" ? "Back to My Books" : "Back to Home";
  const [book, setBook] = useState<Book | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isOwner = Boolean(session?.user.id && book?.owner_id === session.user.id);

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
      } else {
        setBook(data);

        if (data?.owner_id) {
          const { data: ownerData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.owner_id)
            .maybeSingle();

          if (isMounted) {
            setOwner(ownerData ?? null);
          }
        }
      }

      setIsLoading(false);
    }

    loadBook();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  const removeStorageCover = async (path: string | null) => {
    if (!path || path.startsWith("http")) {
      return;
    }

    await supabase.storage.from("book-covers").remove([path]);
  };

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

    await removeStorageCover(book.cover_path);
    navigateToScreen("books", "my-books");
    setIsDeleting(false);
  };

  const handleToggleAvailability = async () => {
    if (!book || !isOwner) {
      return;
    }

    const nextPublished = !book.is_published;
    setBook({ ...book, is_published: nextPublished });
    setErrorMessage(null);

    const { error } = await supabase
      .from("books")
      .update({ is_published: nextPublished })
      .eq("id", book.id);

    if (error) {
      setBook(book);
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
    });
  };

  const coverSource = book?.cover_path?.startsWith("http")
    ? book.cover_path
    : book?.cover_path
      ? supabase.storage.from("book-covers").getPublicUrl(book.cover_path).data
          .publicUrl
      : NO_COVER_IMAGE;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() => navigateToScreen(backSection, backScreen)}
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
            <Image
              source={
                typeof coverSource === "string"
                  ? { uri: coverSource }
                  : coverSource
              }
              style={styles.cover}
              contentFit="cover"
            />
            <ThemedText type="title" style={styles.title}>
              {book.title}
            </ThemedText>
            <ThemedText style={[styles.author, { color: colors.tabIconDefault }]}>
              {book.author}
            </ThemedText>
            <ThemedText style={[styles.metaText, { color: colors.tabIconDefault }]}>
              Published by {owner?.display_name ?? "BookTrade reader"}
            </ThemedText>

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
                style={[styles.badge, { backgroundColor: colors.tint + "15" }]}
              >
                <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
                  {book.is_published ? "Available" : "Unavailable"}
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedText style={styles.description}>
              {book.description || "No description yet."}
            </ThemedText>

            {isOwner ? (
              <ThemedView style={styles.ownerActions}>
                <Pressable
                  onPress={() =>
                    navigateToScreen(backSection, "edit-book", {
                      bookId: book.id,
                      returnSection: backSection,
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
            ) : (
              <Pressable
                onPress={handleRequestTrade}
                style={[styles.tradeButton, { backgroundColor: colors.tint }]}
              >
                <ThemedText style={styles.tradeButtonText}>Request trade</ThemedText>
              </Pressable>
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
  metaText: {
    marginTop: 10,
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
