import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import type { Book } from "@/src/types/database";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function BookScreen() {
  const { navigationState, navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const bookId = navigationState.params?.bookId;
  const backSection = navigationState.currentSection === "books" ? "books" : "home";
  const backScreen = backSection === "books" ? "my-books" : "home-main";
  const backLabel = backSection === "books" ? "Back to My Books" : "Back to Home";
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      }

      setIsLoading(false);
    }

    loadBook();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  const coverUrl = book?.cover_path?.startsWith("http")
    ? book.cover_path
    : book?.cover_path
      ? supabase.storage.from("book-covers").getPublicUrl(book.cover_path).data
          .publicUrl
      : "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800";

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
            <Image source={{ uri: coverUrl }} style={styles.cover} contentFit="cover" />
            <ThemedText type="title" style={styles.title}>
              {book.title}
            </ThemedText>
            <ThemedText style={[styles.author, { color: colors.tabIconDefault }]}>
              {book.author}
            </ThemedText>

            <ThemedView
              style={[styles.badge, { backgroundColor: colors.tint + "15" }]}
            >
              <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
                {book.condition.replace("_", " ")} condition
              </ThemedText>
            </ThemedView>

            <ThemedText style={styles.description}>
              {book.description || "No description yet."}
            </ThemedText>

            <Pressable style={[styles.tradeButton, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.tradeButtonText}>Request trade</ThemedText>
            </Pressable>
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
  badge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    marginTop: 18,
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
});
