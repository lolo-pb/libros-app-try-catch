import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export function ExploreScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const profile = {
    name: "Jane Doe",
    avatarUrl: "https://via.placeholder.com/150",
    zone: "Buenos Aires, AR",
    rating: 4, // 0–5
    books: [
      "The Pragmatic Programmer",
      "Clean Code",
      "Designing Data-Intensive Applications",
    ],
  };

  const c = {
    bg: isDark ? "#000" : "#fff",
    text: isDark ? "#fff" : "#000",
    muted: isDark ? "#ddd" : "#666",
    border: isDark ? "#fff" : "#e5e5e5",
    stars: isDark ? "#fff" : "#f5c518",
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.card, { borderColor: c.border, backgroundColor: c.bg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: profile.avatarUrl }}
            style={[styles.avatar, { borderColor: c.border }]}
          />

          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text }]}>{profile.name}</Text>
            <Text style={[styles.zone, { color: c.muted }]}>{profile.zone}</Text>

            {/* Stars */}
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Text key={i} style={{ color: c.stars, fontSize: 18 }}>
                  {i < profile.rating ? "★" : "☆"}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Books */}
        <View style={[styles.section, { borderTopColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Available Books</Text>

          {profile.books.map((book) => (
            <View key={book} style={styles.bookRow}>
              <Text style={[styles.bullet, { color: c.text }]}>•</Text>
              <Text style={[styles.bookText, { color: c.text }]}>{book}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 40,
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
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    backgroundColor: "#999",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
  },
  zone: {
    marginTop: 4,
    fontSize: 14,
  },
  starsRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 2,
  },
  section: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  bookRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    marginRight: 8,
    fontSize: 16,
    lineHeight: 20,
  },
  bookText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
  },
});
