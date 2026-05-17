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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FeedCardVariant = "tall" | "medium" | "compact";

const CARD_VARIANTS: FeedCardVariant[] = ["tall", "medium", "compact"];

function getCardVariant(index: number, columnIndex: number): FeedCardVariant {
  return CARD_VARIANTS[(index + columnIndex) % CARD_VARIANTS.length];
}

function splitIntoColumns(items: GlobalBookWithBooks[]) {
  return items.reduce<[GlobalBookWithBooks[], GlobalBookWithBooks[]]>(
    (columns, item, index) => {
      columns[index % 2].push(item);
      return columns;
    },
    [[], []],
  );
}

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

  const [leftColumnBooks, rightColumnBooks] = useMemo(
    () => splitIntoColumns(filteredGlobalBooks),
    [filteredGlobalBooks],
  );

  const renderBookCard = (
    globalBook: GlobalBookWithBooks,
    columnIndex: number,
    itemIndex: number,
  ) => {
    const variant = getCardVariant(itemIndex, columnIndex);
    const coverHeightStyle =
      variant === "tall"
        ? styles.coverTall
        : variant === "medium"
          ? styles.coverMedium
          : styles.coverCompact;

    return (
      <Pressable
        key={globalBook.id}
        onPress={() =>
          navigateToScreen("home", "global-book", {
            globalBookId: globalBook.id,
          })
        }
        style={({ pressed }) => [
          styles.feedCard,
          {
            backgroundColor: colorScheme === "dark" ? "#232426" : "#f7f2ec",
            borderColor: colorScheme === "dark" ? "#2f3235" : "#eadfd1",
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <Image
          source={resolveCoverSource({
            cover_path: globalBook.display_cover_path,
          })}
          style={[styles.feedCardImage, coverHeightStyle]}
          contentFit="cover"
          transition={400}
        />
        <View style={styles.feedCardContent}>
          <ThemedText
            type="defaultSemiBold"
            style={styles.feedCardTitle}
            numberOfLines={2}
          >
            {globalBook.title}
          </ThemedText>
          <ThemedText
            style={[styles.feedCardAuthor, { color: colors.tabIconDefault }]}
            numberOfLines={1}
          >
            {globalBook.author}
          </ThemedText>
          <ThemedText
            style={[styles.feedCardEditorial, { color: colors.tabIconDefault }]}
            numberOfLines={2}
          >
            {globalBook.editorial || "Editorial not added yet"}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              tintColor={colors.tint}
              onRefresh={handleRefresh}
            />
          }
        >
          <ThemedView style={styles.sectionHeader}>
            <View>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Catalog
              </ThemedText>
              <ThemedText
                style={[styles.sectionCaption, { color: colors.tabIconDefault }]}
              >
                {filteredGlobalBooks.length} of {globalBooks.length} topics showing
              </ThemedText>
            </View>
          </ThemedView>

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
            <View style={styles.columnsWrapper}>
              <View style={styles.feedColumn}>
                {leftColumnBooks.map((globalBook, itemIndex) =>
                  renderBookCard(globalBook, 0, itemIndex),
                )}
              </View>
              <View style={styles.feedColumn}>
                {rightColumnBooks.map((globalBook, itemIndex) =>
                  renderBookCard(globalBook, 1, itemIndex),
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    alignItems: "center",
    paddingBottom: 6,
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
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  searchInput: {
    fontSize: 16,
  },
  sectionHeader: {
    paddingTop: 8,
    paddingBottom: 18,
    width: "100%",
  },
  sectionTitle: {
    marginBottom: 0,
  },
  sectionCaption: {
    marginTop: 4,
    fontSize: 13,
  },
  columnsWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  feedColumn: {
    flex: 1,
    gap: 14,
  },
  feedCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
  },
  feedCardImage: {
    width: "100%",
  },
  coverTall: {
    height: 236,
  },
  coverMedium: {
    height: 210,
  },
  coverCompact: {
    height: 184,
  },
  feedCardContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 4,
  },
  feedCardTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  feedCardAuthor: {
    fontSize: 13,
  },
  feedCardEditorial: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackState: {
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    minHeight: 360,
    paddingHorizontal: 28,
    paddingVertical: 48,
    width: "100%",
  },
  feedbackText: {
    textAlign: "center",
    lineHeight: 20,
  },
  feedbackButton: {
    alignItems: "center",
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  feedbackButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
