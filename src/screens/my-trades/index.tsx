import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { resolveCoverSource } from "@/src/lib/book-covers";
import { supabase } from "@/src/lib/supabase";
import type { Book, Profile, TradeRequest } from "@/src/types/database";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TradeView = TradeRequest & {
  targetBook?: Book;
  offeredBook?: Book;
  otherProfile?: Profile;
};

function statusLabel(status: TradeRequest["status"]) {
  return status[0].toUpperCase() + status.slice(1);
}

export function MyTradesScreen() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const { navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [sentTrades, setSentTrades] = useState<TradeView[]>([]);
  const [receivedTrades, setReceivedTrades] = useState<TradeView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const enrichTrades = useCallback(
    async (requests: TradeRequest[], perspective: "sent" | "received") => {
      const bookIds = Array.from(
        new Set(
          requests.flatMap((request) => [
            request.target_book_id,
            request.offered_book_id,
          ]),
        ),
      );
      const profileIds = Array.from(
        new Set(
          requests.map((request) =>
            perspective === "sent" ? request.owner_id : request.requester_id,
          ),
        ),
      );

      const [booksResult, profilesResult] = await Promise.all([
        bookIds.length
          ? supabase.from("books").select("*").in("id", bookIds)
          : Promise.resolve({ data: [] as Book[], error: null }),
        profileIds.length
          ? supabase.from("profiles").select("*").in("id", profileIds)
          : Promise.resolve({ data: [] as Profile[], error: null }),
      ]);

      if (booksResult.error) {
        throw booksResult.error;
      }

      if (profilesResult.error) {
        throw profilesResult.error;
      }

      const booksById = new Map(
        (booksResult.data ?? []).map((book) => [book.id, book]),
      );
      const profilesById = new Map(
        (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
      );

      return requests.map((request) => ({
        ...request,
        targetBook: booksById.get(request.target_book_id),
        offeredBook: booksById.get(request.offered_book_id),
        otherProfile: profilesById.get(
          perspective === "sent" ? request.owner_id : request.requester_id,
        ),
      }));
    },
    [],
  );

  const loadTrades = useCallback(
    async (showSpinner = true) => {
      if (!session) {
        setSentTrades([]);
        setReceivedTrades([]);
        return;
      }

      if (showSpinner) {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const [sentResult, receivedResult] = await Promise.all([
          supabase
            .from("trade_requests")
            .select("*")
            .eq("requester_id", session.user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("trade_requests")
            .select("*")
            .eq("owner_id", session.user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (sentResult.error) {
          throw sentResult.error;
        }

        if (receivedResult.error) {
          throw receivedResult.error;
        }

        const [nextSent, nextReceived] = await Promise.all([
          enrichTrades(sentResult.data ?? [], "sent"),
          enrichTrades(receivedResult.data ?? [], "received"),
        ]);

        setSentTrades(nextSent);
        setReceivedTrades(nextReceived);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load trades.",
        );
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [enrichTrades, session],
  );

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  if (isAuthLoading) {
    return (
      <ThemedView style={styles.centerState}>
        <ActivityIndicator color={colors.tint} />
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ThemedView style={styles.container}>
          <ThemedText type="title">My Trades</ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Sign in to see trade requests.
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
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={colors.tint}
            onRefresh={() => {
              setIsRefreshing(true);
              loadTrades(false);
            }}
          />
        }
      >
        <ThemedText type="title" style={styles.title}>
          My Trades
        </ThemedText>
        <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
          Track sent and received trade requests.
        </ThemedText>

        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
          </ThemedView>
        ) : errorMessage ? (
          <ThemedView style={styles.centerState}>
            <ThemedText type="defaultSemiBold">Could not load trades</ThemedText>
            <ThemedText style={[styles.centerText, { color: colors.tabIconDefault }]}>
              {errorMessage}
            </ThemedText>
            <Pressable
              onPress={() => loadTrades()}
              style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            >
              <ThemedText style={styles.primaryButtonText}>Try again</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <>
            <TradeSection
              title="Sent"
              emptyText="Request a trade from a book detail page."
              roleLabel="Owner"
              trades={sentTrades}
              colors={colors}
              onOpenTrade={(tradeId) =>
                navigateToScreen("trades", "trade-detail", {
                  tradeRequestId: tradeId,
                })
              }
            />
            <TradeSection
              title="Received"
              emptyText="Requests for your books will appear here."
              roleLabel="Requester"
              trades={receivedTrades}
              colors={colors}
              onOpenTrade={(tradeId) =>
                navigateToScreen("trades", "trade-detail", {
                  tradeRequestId: tradeId,
                })
              }
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TradeSection({
  title,
  emptyText,
  roleLabel,
  trades,
  colors,
  onOpenTrade,
}: {
  title: string;
  emptyText: string;
  roleLabel: string;
  trades: TradeView[];
  colors: (typeof Colors)["light"];
  onOpenTrade: (tradeId: string) => void;
}) {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {trades.length === 0 ? (
        <ThemedView style={styles.emptySection}>
          <ThemedText style={[styles.centerText, { color: colors.tabIconDefault }]}>
            {emptyText}
          </ThemedText>
        </ThemedView>
      ) : (
        trades.map((trade) => (
          <Pressable
            key={trade.id}
            onPress={() => onOpenTrade(trade.id)}
            style={[styles.tradeRow, { borderColor: colors.icon }]}
          >
            <Image
              source={resolveCoverSource(trade.targetBook)}
              style={styles.cover}
              contentFit="cover"
            />
            <Image
              source={resolveCoverSource(trade.offeredBook)}
              style={styles.cover}
              contentFit="cover"
            />
            <ThemedView style={styles.tradeInfo}>
              <ThemedText type="defaultSemiBold" style={styles.rowTitle}>
                {trade.targetBook?.title ?? "Requested book"}
              </ThemedText>
              <ThemedText style={{ color: colors.tabIconDefault }}>
                For {trade.offeredBook?.title ?? "offered book"}
              </ThemedText>
              <ThemedText style={{ color: colors.tabIconDefault }}>
                {roleLabel}: {trade.otherProfile?.display_name ?? "BookTrade reader"}
              </ThemedText>
              <ThemedView
                style={[styles.statusBadge, { backgroundColor: colors.tint + "15" }]}
              >
                <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
                  {statusLabel(trade.status)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </Pressable>
        ))
      )}
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
  section: {
    marginBottom: 26,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  tradeRow: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    padding: 10,
  },
  cover: {
    borderRadius: 8,
    height: 78,
    width: 54,
  },
  tradeInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
});
