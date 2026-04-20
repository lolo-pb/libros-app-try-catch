import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import type { Book } from "@/src/types/database";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NO_COVER_IMAGE = require("../../../assets/images/no-cover-available.png");

function getCoverSource(book?: Book | null) {
  if (!book?.cover_path) {
    return NO_COVER_IMAGE;
  }

  if (book.cover_path.startsWith("http")) {
    return { uri: book.cover_path };
  }

  return {
    uri: supabase.storage.from("book-covers").getPublicUrl(book.cover_path).data
      .publicUrl,
  };
}

export function SelectTradeBookScreen() {
  const { session } = useAuth();
  const { navigationState, navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const targetBookId = navigationState.params?.targetBookId;
  const [targetBook, setTargetBook] = useState<Book | null>(null);
  const [ownedBooks, setOwnedBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [hasPendingForTarget, setHasPendingForTarget] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTradeOptions() {
      if (!session) {
        setIsLoading(false);
        return;
      }

      if (!targetBookId) {
        setErrorMessage("No book selected.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const [targetResult, booksResult, pendingResult] = await Promise.all([
        supabase.from("books").select("*").eq("id", targetBookId).maybeSingle(),
        supabase
          .from("books")
          .select("*")
          .eq("owner_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("trade_requests")
          .select("id")
          .eq("requester_id", session.user.id)
          .eq("target_book_id", targetBookId)
          .eq("status", "pending")
          .limit(1),
      ]);

      if (!isMounted) {
        return;
      }

      if (targetResult.error) {
        setErrorMessage(targetResult.error.message);
      } else if (!targetResult.data) {
        setErrorMessage("This book could not be found.");
      } else if (booksResult.error) {
        setErrorMessage(booksResult.error.message);
      } else if (pendingResult.error) {
        setErrorMessage(pendingResult.error.message);
      } else {
        setTargetBook(targetResult.data);
        setOwnedBooks(booksResult.data ?? []);
        setHasPendingForTarget(Boolean(pendingResult.data?.length));
      }

      setIsLoading(false);
    }

    loadTradeOptions();

    return () => {
      isMounted = false;
    };
  }, [session, targetBookId]);

  if (!session) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">Request Trade</ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Sign in to request a trade.
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() =>
            navigateToScreen("home", targetBookId ? "book" : "home-main", {
              bookId: targetBookId,
            })
          }
          style={[styles.backButton, { backgroundColor: colors.tint + "15" }]}
        >
          <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
            Back
          </ThemedText>
        </Pressable>

        <ThemedText type="title" style={styles.title}>
          Choose your offer
        </ThemedText>
        <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
          Pick one of your books to offer for this trade.
        </ThemedText>

        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
            <ThemedText style={{ color: colors.tabIconDefault }}>
              Loading your books...
            </ThemedText>
          </ThemedView>
        ) : errorMessage ? (
          <ThemedView style={styles.centerState}>
            <ThemedText type="defaultSemiBold">Could not load trade</ThemedText>
            <ThemedText style={[styles.centerText, { color: colors.tabIconDefault }]}>
              {errorMessage}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            {targetBook ? (
              <ThemedView style={[styles.targetCard, { borderColor: colors.icon }]}>
                <Image
                  source={getCoverSource(targetBook)}
                  style={styles.targetCover}
                  contentFit="cover"
                />
                <ThemedView style={styles.targetInfo}>
                  <ThemedText type="defaultSemiBold">Requested book</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.bookTitle}>
                    {targetBook.title}
                  </ThemedText>
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    {targetBook.author}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            ) : null}

            {hasPendingForTarget ? (
              <ThemedView
                style={[
                  styles.warningBox,
                  {
                    backgroundColor: "#FFF4CC",
                    borderColor: "#F2C94C",
                  },
                ]}
              >
                <ThemedText style={{ color: "#7A4F00", fontWeight: "700" }}>
                  You already have a pending request for this book.
                </ThemedText>
              </ThemedView>
            ) : null}

            <ThemedView style={styles.dividerSection}>
              <ThemedView
                style={[styles.dividerLine, { backgroundColor: colors.icon }]}
              />
              <ThemedText type="subtitle" style={styles.offerTitle}>
                My books
              </ThemedText>
              <ThemedText style={{ color: colors.tabIconDefault }}>
                Select the book you want to offer.
              </ThemedText>
            </ThemedView>

            {ownedBooks.length === 0 ? (
              <ThemedView style={styles.centerState}>
                <ThemedText type="defaultSemiBold">No books to offer yet</ThemedText>
                <ThemedText style={[styles.centerText, { color: colors.tabIconDefault }]}>
                  Add a book before requesting a trade.
                </ThemedText>
                <Pressable
                  onPress={() => navigateToScreen("books", "new-book")}
                  style={[styles.primaryButton, { backgroundColor: colors.tint }]}
                >
                  <ThemedText style={styles.primaryButtonText}>Add a book</ThemedText>
                </Pressable>
              </ThemedView>
            ) : (
              <>
                {ownedBooks.map((book) => {
                  const isSelected = selectedBookId === book.id;
                  return (
                    <Pressable
                      key={book.id}
                      onPress={() => setSelectedBookId(book.id)}
                      style={[styles.bookRow, { borderColor: colors.icon }]}
                    >
                      <Image
                        source={getCoverSource(book)}
                        style={styles.bookCover}
                        contentFit="cover"
                      />
                      <ThemedView style={styles.bookInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.bookTitle}>
                          {book.title}
                        </ThemedText>
                        <ThemedText style={{ color: colors.tabIconDefault }}>
                          {book.author}
                        </ThemedText>
                        <ThemedText style={{ color: colors.tabIconDefault }}>
                          {book.is_published ? "Available" : "Unavailable"}
                        </ThemedText>
                      </ThemedView>
                      <ThemedView
                        style={[
                          styles.radio,
                          {
                            borderColor: isSelected ? colors.tint : colors.icon,
                            backgroundColor: isSelected
                              ? colors.tint
                              : "transparent",
                          },
                        ]}
                      >
                        {isSelected ? (
                          <ThemedText style={styles.radioMark}>x</ThemedText>
                        ) : null}
                      </ThemedView>
                    </Pressable>
                  );
                })}
                <Pressable
                  disabled={!selectedBookId}
                  onPress={() =>
                    navigateToScreen("home", "confirm-trade", {
                      targetBookId,
                      offeredBookId: selectedBookId ?? undefined,
                    })
                  }
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: selectedBookId
                        ? colors.tint
                        : colors.tabIconDefault,
                    },
                  ]}
                >
                  <ThemedText style={styles.primaryButtonText}>Trade</ThemedText>
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
  title: {
    fontSize: 30,
    marginBottom: 6,
  },
  helperText: {
    marginBottom: 22,
  },
  centerState: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
  },
  centerText: {
    textAlign: "center",
  },
  targetCard: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    padding: 12,
  },
  targetCover: {
    borderRadius: 8,
    height: 96,
    width: 68,
  },
  targetInfo: {
    flex: 1,
    gap: 2,
  },
  warningBox: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  dividerSection: {
    marginBottom: 14,
    marginTop: 4,
  },
  dividerLine: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 14,
    opacity: 0.35,
    width: "100%",
  },
  offerTitle: {
    marginBottom: 4,
  },
  bookRow: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    padding: 10,
  },
  bookCover: {
    borderRadius: 8,
    height: 92,
    width: 64,
  },
  bookInfo: {
    flex: 1,
    gap: 2,
  },
  bookTitle: {
    fontSize: 17,
  },
  radio: {
    alignItems: "center",
    borderRadius: 11,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  radioMark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 15,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    marginTop: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
