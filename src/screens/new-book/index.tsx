import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import type { BookCondition } from "@/src/types/database";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONDITIONS: BookCondition[] = ["new", "like_new", "good", "fair", "poor"];

export function NewBookScreen() {
  const { session } = useAuth();
  const { navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverPath, setCoverPath] = useState("");
  const [condition, setCondition] = useState<BookCondition>("good");
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
      color: colors.text,
    },
  ];

  const handleSave = async () => {
    if (!session) {
      navigateToScreen("user", "login");
      return;
    }

    if (!title.trim() || !author.trim()) {
      setMessage("Title and author are required.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { error } = await supabase.from("books").insert({
      author: author.trim(),
      condition,
      cover_path: coverPath.trim() || null,
      description: description.trim() || null,
      is_published: isPublished,
      owner_id: session.user.id,
      title: title.trim(),
    });

    if (error) {
      setMessage(error.message);
    } else {
      navigateToScreen("books", "my-books");
    }

    setIsSubmitting(false);
  };

  if (!session) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">New Book</ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Sign in before adding books to your shelf.
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
        <ThemedText type="title" style={styles.title}>
          New Book
        </ThemedText>
        <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
          Add a book to your shelf. Published books appear on Home.
        </ThemedText>

        <TextInput
          placeholder="Title"
          placeholderTextColor={colors.tabIconDefault}
          value={title}
          onChangeText={setTitle}
          style={inputStyle}
        />
        <TextInput
          placeholder="Author"
          placeholderTextColor={colors.tabIconDefault}
          value={author}
          onChangeText={setAuthor}
          style={inputStyle}
        />
        <TextInput
          multiline
          placeholder="Description"
          placeholderTextColor={colors.tabIconDefault}
          value={description}
          onChangeText={setDescription}
          style={[inputStyle, styles.textArea]}
        />
        <TextInput
          autoCapitalize="none"
          placeholder="Cover image URL for now"
          placeholderTextColor={colors.tabIconDefault}
          value={coverPath}
          onChangeText={setCoverPath}
          style={inputStyle}
        />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Condition
        </ThemedText>
        <ThemedView style={styles.conditionRow}>
          {CONDITIONS.map((item) => {
            const isActive = condition === item;
            return (
              <Pressable
                key={item}
                onPress={() => setCondition(item)}
                style={[
                  styles.conditionChip,
                  {
                    backgroundColor: isActive ? colors.tint : colors.tint + "15",
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color: isActive ? "#fff" : colors.tint,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {item.replace("_", " ")}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        <ThemedView style={styles.publishRow}>
          <ThemedView style={styles.publishText}>
            <ThemedText type="defaultSemiBold">Publish now</ThemedText>
            <ThemedText style={{ color: colors.tabIconDefault }}>
              Turn this on to show it on Home.
            </ThemedText>
          </ThemedView>
          <Switch value={isPublished} onValueChange={setIsPublished} />
        </ThemedView>

        {message ? (
          <ThemedText style={[styles.message, { color: colors.tint }]}>
            {message}
          </ThemedText>
        ) : null}

        <Pressable
          disabled={isSubmitting}
          onPress={handleSave}
          style={[styles.primaryButton, { backgroundColor: colors.tint }]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Save book</ThemedText>
          )}
        </Pressable>
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
  title: {
    fontSize: 30,
    marginBottom: 6,
  },
  helperText: {
    marginBottom: 22,
  },
  input: {
    borderRadius: 8,
    fontSize: 16,
    minHeight: 48,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  label: {
    marginBottom: 10,
    marginTop: 4,
  },
  conditionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  conditionChip: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  publishRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 18,
  },
  publishText: {
    flex: 1,
  },
  message: {
    marginBottom: 12,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
