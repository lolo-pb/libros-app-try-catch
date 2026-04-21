import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { resolveCoverSource } from "@/src/lib/book-covers";
import { supabase } from "@/src/lib/supabase";
import type { Book } from "@/src/types/database";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const BOOKTRADE_PINK = "#e91e63";

export function ConfirmTradeScreen() {
  const { session } = useAuth();
  const { navigationState, navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const targetBookId = navigationState.params?.targetBookId;
  const offeredBookId = navigationState.params?.offeredBookId;
  const globalBookId = navigationState.params?.globalBookId;
  const [targetBook, setTargetBook] = useState<Book | null>(null);
  const [offeredBook, setOfferedBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBooks() {
      if (!session) {
        setIsLoading(false);
        return;
      }

      if (!targetBookId || !offeredBookId) {
        setErrorMessage("Choose both books before confirming.");
        setIsLoading(false);
        return;
      }

      const [targetResult, offeredResult] = await Promise.all([
        supabase.from("books").select("*").eq("id", targetBookId).maybeSingle(),
        supabase.from("books").select("*").eq("id", offeredBookId).maybeSingle(),
      ]);

      if (!isMounted) {
        return;
      }

      if (targetResult.error) {
        setErrorMessage(targetResult.error.message);
      } else if (offeredResult.error) {
        setErrorMessage(offeredResult.error.message);
      } else if (!targetResult.data || !offeredResult.data) {
        setErrorMessage("One of these books could not be found.");
      } else {
        setTargetBook(targetResult.data);
        setOfferedBook(offeredResult.data);
      }

      setIsLoading(false);
    }

    loadBooks();

    return () => {
      isMounted = false;
    };
  }, [offeredBookId, session, targetBookId]);

  const handleConfirm = async () => {
    if (!session || !targetBook || !offeredBook) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.from("trade_requests").insert({
      offered_book_id: offeredBook.id,
      owner_id: targetBook.owner_id,
      requester_id: session.user.id,
      target_book_id: targetBook.id,
    });

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "You already sent this exact trade request."
          : error.message,
      );
    } else {
      navigateToScreen("trades", "my-trades");
    }

    setIsSubmitting(false);
  };

  if (!session) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ThemedView style={styles.container}>
          <ThemedText type="title">Confirm Trade</ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Sign in to confirm a trade.
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
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() =>
            navigateToScreen("home", "select-trade-book", {
              targetBookId,
              globalBookId,
            })
          }
          style={[styles.backButton, { backgroundColor: colors.tint + "15" }]}
        >
          <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
            Back
          </ThemedText>
        </Pressable>

        <ThemedText type="title" style={styles.title}>
          Confirm Trade
        </ThemedText>
        <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
          Review both books before sending the request.
        </ThemedText>

        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
          </ThemedView>
        ) : errorMessage && (!targetBook || !offeredBook) ? (
          <ThemedView style={styles.centerState}>
            <ThemedText type="defaultSemiBold">Could not prepare trade</ThemedText>
            <ThemedText style={[styles.centerText, { color: colors.tabIconDefault }]}>
              {errorMessage}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            <TradeBookCard label="You want" book={targetBook} />
            <TradeBookCard label="You offer" book={offeredBook} />
            {errorMessage ? (
              <ThemedText style={[styles.errorText, { color: colors.tint }]}>
                {errorMessage}
              </ThemedText>
            ) : null}
            <Pressable
              disabled={isSubmitting}
              onPress={handleConfirm}
              style={[styles.primaryButton, { backgroundColor: BOOKTRADE_PINK }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>
                  Confirm trade
                </ThemedText>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TradeBookCard({ label, book }: { label: string; book: Book | null }) {
  return (
    <ThemedView style={styles.tradeCard}>
      <Image
        source={resolveCoverSource(book)}
        style={styles.tradeCover}
        contentFit="cover"
      />
      <ThemedView style={styles.tradeInfo}>
        <ThemedText type="defaultSemiBold">{label}</ThemedText>
        <ThemedText type="subtitle">{book?.title ?? "Book unavailable"}</ThemedText>
        <ThemedText>{book?.author ?? ""}</ThemedText>
      </ThemedView>
    </ThemedView>
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
  tradeCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  tradeCover: {
    borderRadius: 12,
    height: 150,
    width: 104,
  },
  tradeInfo: {
    flex: 1,
    gap: 4,
  },
  errorText: {
    marginBottom: 12,
    textAlign: "center",
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
