import { ThemedText } from "@/src/components/themed-text";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

export function ExploreScreen() {
  const isDark = useColorScheme() === "dark";

  const profile = {
    name: "Jane Doe",
    avatarUrl: "https://via.placeholder.com/150",
    zone: "Buenos Aires, AR",
    rating: 4,
    books: [
      "The Pragmatic Programmer",
      "Clean Code",
      "Designing Data-Intensive Applications",
    ],
  };

  const colors = {
    bg: isDark ? "#000" : "#fff",
    border: isDark ? "#fff" : "#e5e5e5",
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* STATIC HEADER (outside scroll) */}
      <View style={styles.logoContainer}>
        <ThemedText type="title" style={styles.logoText}>
          BookTrade
        </ThemedText>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { borderColor: colors.border }]}>
          {/* header */}
          <View style={styles.header}>
            <Image
              source={{ uri: profile.avatarUrl }}
              style={[styles.avatar, { borderColor: colors.border }]}
            />

            <View style={styles.headerText}>
              <ThemedText type="subtitle">{profile.name}</ThemedText>
              <ThemedText type="defaultSemiBold">
                {profile.zone}
              </ThemedText>

              <View style={styles.stars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <ThemedText key={i}>
                    {i < profile.rating ? "★" : "☆"}
                  </ThemedText>
                ))}
              </View>
            </View>
          </View>

          {/* books */}
          <View style={styles.section}>
            <ThemedText type="subtitle">Favorite Books</ThemedText>

            {profile.books.map((book) => (
              <View key={book} style={styles.bookRow}>
                <ThemedText>•</ThemedText>
                <ThemedText>{book}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  logoContainer: {
    paddingTop: 48,
    paddingBottom: 16,
    alignItems: "center",
  },
  logoText: {
    fontSize: 28,
    color: "#E91E63", // A pretty pink/red "BookTrade" brand color//can change
    fontWeight: "900",
  },
  scrollContent: {
    padding: 16,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 600,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
  },
  stars: {
    flexDirection: "row",
    marginTop: 8,
    gap: 2,
  },
  section: {
    marginTop: 20,
    paddingTop: 16,
  },
  bookRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
});
