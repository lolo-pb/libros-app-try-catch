import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import type { Book, Profile, TradeRequest } from "@/src/types/database";
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

function statusLabel(status: TradeRequest["status"]) {
  return status[0].toUpperCase() + status.slice(1);
}

export function TradeDetailScreen() {
  const { session } = useAuth();
  const { navigationState, navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const tradeRequestId = navigationState.params?.tradeRequestId;
  const [trade, setTrade] = useState<TradeRequest | null>(null);
  const [targetBook, setTargetBook] = useState<Book | null>(null);
  const [offeredBook, setOfferedBook] = useState<Book | null>(null);
  const [requester, setRequester] = useState<Profile | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTrade() {
      if (!session) {
        setIsLoading(false);
        return;
      }

      if (!tradeRequestId) {
        setErrorMessage("No trade selected.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("trade_requests")
        .select("*")
        .eq("id", tradeRequestId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (!data) {
        setErrorMessage("This trade request could not be found.");
        setIsLoading(false);
        return;
      }

      const [booksResult, profilesResult] = await Promise.all([
        supabase
          .from("books")
          .select("*")
          .in("id", [data.target_book_id, data.offered_book_id]),
        supabase
          .from("profiles")
          .select("*")
          .in("id", [data.requester_id, data.owner_id]),
      ]);

      if (!isMounted) {
        return;
      }

      if (booksResult.error) {
        setErrorMessage(booksResult.error.message);
      } else if (profilesResult.error) {
        setErrorMessage(profilesResult.error.message);
      } else {
        setTrade(data);
        setTargetBook(
          (booksResult.data ?? []).find((book) => book.id === data.target_book_id) ??
            null,
        );
        setOfferedBook(
          (booksResult.data ?? []).find((book) => book.id === data.offered_book_id) ??
            null,
        );
        setRequester(
          (profilesResult.data ?? []).find(
            (profile) => profile.id === data.requester_id,
          ) ?? null,
        );
        setOwner(
          (profilesResult.data ?? []).find((profile) => profile.id === data.owner_id) ??
            null,
        );
      }

      setIsLoading(false);
    }

    loadTrade();

    return () => {
      isMounted = false;
    };
  }, [session, tradeRequestId]);

  const handleStatusUpdate = async (status: TradeRequest["status"]) => {
    if (!trade) {
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("trade_requests")
      .update({ status })
      .eq("id", trade.id)
      .select("*")
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
    } else if (data) {
      setTrade(data);
    }

    setIsUpdating(false);
  };

  const isOwner = Boolean(session?.user.id && trade?.owner_id === session.user.id);

  if (!session) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">Trade Detail</ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Sign in to see trades.
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
          onPress={() => navigateToScreen("trades", "my-trades")}
          style={[styles.backButton, { backgroundColor: colors.tint + "15" }]}
        >
          <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
            Back to My Trades
          </ThemedText>
        </Pressable>

        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
          </ThemedView>
        ) : errorMessage && !trade ? (
          <ThemedView style={styles.centerState}>
            <ThemedText type="defaultSemiBold">Could not load trade</ThemedText>
            <ThemedText style={[styles.centerText, { color: colors.tabIconDefault }]}>
              {errorMessage}
            </ThemedText>
          </ThemedView>
        ) : trade ? (
          <>
            <ThemedText type="title" style={styles.title}>
              Trade Request
            </ThemedText>
            <ThemedView
              style={[styles.statusBadge, { backgroundColor: colors.tint + "15" }]}
            >
              <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
                {statusLabel(trade.status)}
              </ThemedText>
            </ThemedView>

            <TradeBookCard label="Requested book" book={targetBook} />
            <TradeBookCard label="Offered book" book={offeredBook} />

            <ThemedView style={[styles.peopleBox, { borderColor: colors.icon }]}>
              <ThemedText style={{ color: colors.tabIconDefault }}>
                Requester: {requester?.display_name ?? "BookTrade reader"}
              </ThemedText>
              <ThemedText style={{ color: colors.tabIconDefault }}>
                Owner: {owner?.display_name ?? "BookTrade reader"}
              </ThemedText>
            </ThemedView>

            {errorMessage ? (
              <ThemedText style={[styles.errorText, { color: colors.tint }]}>
                {errorMessage}
              </ThemedText>
            ) : null}

            {isOwner && trade.status === "pending" ? (
              <ThemedView style={styles.actions}>
                <Pressable
                  disabled={isUpdating}
                  onPress={() => handleStatusUpdate("accepted")}
                  style={[styles.primaryButton, { backgroundColor: colors.tint }]}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.primaryButtonText}>
                      Accept trade
                    </ThemedText>
                  )}
                </Pressable>
                <Pressable
                  disabled={isUpdating}
                  onPress={() => handleStatusUpdate("declined")}
                  style={[styles.secondaryButton, { borderColor: colors.icon }]}
                >
                  <ThemedText type="defaultSemiBold">Decline</ThemedText>
                </Pressable>
              </ThemedView>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TradeBookCard({ label, book }: { label: string; book: Book | null }) {
  return (
    <ThemedView style={styles.tradeCard}>
      <Image source={getCoverSource(book)} style={styles.tradeCover} contentFit="cover" />
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
    marginBottom: 12,
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
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    marginBottom: 22,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  peopleBox: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginBottom: 18,
    padding: 12,
  },
  errorText: {
    marginBottom: 12,
    textAlign: "center",
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
  },
});
