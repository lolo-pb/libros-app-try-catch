import { Image } from "expo-image";
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useColorScheme } from "@/src/hooks/use-color-scheme";

const RECOMMENDED_BOOKS = [
  { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', cover: 'https://images.unsplash.com/photo-1543005187-9f4c4b7a80fe?w=400' },
  { id: '2', title: '1984', author: 'George Orwell', cover: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400' },
  { id: '3', title: 'The Hobbit', author: 'J.R.R. Tolkien', cover: 'https://images.unsplash.com/photo-1621351123083-b88ecd2d5708?w=400' },
  { id: '4', title: 'Ulysses', author: 'James Joyce', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400' },
];

export function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [search, setSearch] = useState('');

  return (
    <ThemedView style={styles.container}>
      {/* --- FIXED HEADER SECTION --- */}
      <SafeAreaView style={{ backgroundColor: colors.background }}>
        <ThemedView style={styles.fixedHeader}>
          <ThemedText type="title" style={styles.logoText}>BookTrade</ThemedText>
          <ThemedView style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search nearby books..."
              placeholderTextColor={colors.tabIconDefault}
              value={search}
              onChangeText={setSearch}
            />
          </ThemedView>
        </ThemedView>
      </SafeAreaView>

      {/* --- SCROLLABLE CONTENT --- */}
      <ScrollView stickyHeaderIndices={[]} showsVerticalScrollIndicator={false}>

        {/* 1. Map Section (Goes up when scrolling) */}
        <ThemedView style={styles.mapSection}>
          <ThemedView style={[styles.mapPlaceholder, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
            <ThemedText style={styles.mapPin}>📍</ThemedText>
            <ThemedText type="subtitle">Books near you</ThemedText>
            <ThemedText style={{ color: colors.tabIconDefault }}>Showing 12 active trades</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 2. Recommendations List */}
        <ThemedView style={styles.contentPadding}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recommended for you</ThemedText>

          {RECOMMENDED_BOOKS.map((book) => (
            <TouchableOpacity key={book.id} style={styles.bookCard}>
              <Image
                source={{ uri: book.cover }}
                style={styles.bookCover}
                contentFit="cover"
                transition={400}
              />
              <ThemedView style={styles.bookInfo}>
                <ThemedText type="defaultSemiBold" style={styles.titleText}>{book.title}</ThemedText>
                <ThemedText style={{ color: colors.tabIconDefault }}>{book.author}</ThemedText>

                <ThemedView style={[styles.badge, { backgroundColor: colors.tint + '15' }]}>
                  <ThemedText style={{ color: colors.tint, fontSize: 12, fontWeight: '600' }}>2.4 miles away</ThemedText>
                </ThemedView>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 10,
    gap: 12,
  },
  logoText: {
    fontSize: 28,
    color: '#E91E63', // A pretty pink/red "BookTrade" brand color
    fontWeight: '900',
  },
  searchContainer: {
    height: 45,
    borderRadius: 12,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 16,
  },
  mapSection: {
    padding: 20,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  mapPin: {
    fontSize: 40,
    marginBottom: 5,
  },
  contentPadding: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  bookCard: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    gap: 15,
  },
  bookCover: {
    width: 90,
    height: 130,
    borderRadius: 12,
  },
  bookInfo: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontSize: 18,
  },
  badge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});