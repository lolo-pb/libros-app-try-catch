import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import type { Book, BookCondition } from "@/src/types/database";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONDITIONS: BookCondition[] = ["new", "like_new", "good", "fair", "poor"];

export function EditBookScreen() {
  const { session } = useAuth();
  const { navigationState, navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const bookId = navigationState.params?.bookId;
  const returnSection =
    navigationState.params?.returnSection === "home" ? "home" : "books";
  const [book, setBook] = useState<Book | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [coverAsset, setCoverAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [shouldRemoveCover, setShouldRemoveCover] = useState(false);
  const [condition, setCondition] = useState<BookCondition>("good");
  const [isPublished, setIsPublished] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
      color: colors.text,
    },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadBook() {
      if (!session) {
        setMessage("Sign in to edit your books.");
        setIsLoading(false);
        return;
      }

      if (!bookId) {
        setMessage("No book selected.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error || !data) {
        setMessage(error?.message ?? "Book could not be found.");
      } else if (data.owner_id !== session.user.id) {
        setMessage("Only the owner can edit this book.");
      } else {
        setBook(data);
        setTitle(data.title);
        setAuthor(data.author);
        setDescription(data.description ?? "");
        setCoverPath(data.cover_path);
        setCondition(data.condition);
        setIsPublished(data.is_published);
      }

      setIsLoading(false);
    }

    loadBook();

    return () => {
      isMounted = false;
    };
  }, [bookId, session]);

  const getExistingCoverUrl = () => {
    if (!coverPath) {
      return null;
    }

    if (coverPath.startsWith("http")) {
      return coverPath;
    }

    return supabase.storage.from("book-covers").getPublicUrl(coverPath).data
      .publicUrl;
  };

  const handleChooseCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage("Allow photo access to choose a cover image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [2, 3],
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (!result.canceled) {
      setCoverAsset(result.assets[0]);
      setShouldRemoveCover(false);
      setMessage(null);
    }
  };

  const uploadCover = async (userId: string) => {
    if (!coverAsset) {
      return null;
    }

    const mimeType = coverAsset.mimeType ?? "image/jpeg";
    const extension = mimeType.split("/")[1] ?? "jpg";
    const normalizedExtension = extension === "jpeg" ? "jpg" : extension;
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${normalizedExtension}`;
    const response = await fetch(coverAsset.uri);
    const arrayBuffer = await response.arrayBuffer();
    const { error } = await supabase.storage
      .from("book-covers")
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return filePath;
  };

  const removeStorageCover = async (path: string | null) => {
    if (!path || path.startsWith("http")) {
      return;
    }

    await supabase.storage.from("book-covers").remove([path]);
  };

  const handleSave = async () => {
    if (!session || !book) {
      return;
    }

    if (!title.trim() || !author.trim()) {
      setMessage("Title and author are required.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const uploadedCoverPath = await uploadCover(session.user.id);
      const nextCoverPath = uploadedCoverPath
        ? uploadedCoverPath
        : shouldRemoveCover
          ? null
          : coverPath;

      const { error } = await supabase
        .from("books")
        .update({
          author: author.trim(),
          condition,
          cover_path: nextCoverPath,
          description: description.trim() || null,
          is_published: isPublished,
          title: title.trim(),
        })
        .eq("id", book.id);

      if (error) {
        setMessage(error.message);
      } else {
        if (uploadedCoverPath || shouldRemoveCover) {
          await removeStorageCover(coverPath);
        }
        navigateToScreen(returnSection, "book", { bookId: book.id });
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save this book.",
      );
    }

    setIsSubmitting(false);
  };

  const previewUrl = coverAsset?.uri ?? (shouldRemoveCover ? null : getExistingCoverUrl());

  if (!session) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ThemedView style={styles.container}>
          <ThemedText type="title">Edit Book</ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Sign in to edit your books.
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
            navigateToScreen(
              returnSection,
              bookId
                ? "book"
                : returnSection === "home"
                  ? "home-main"
                  : "my-books",
              { bookId },
            )
          }
          style={[styles.backButton, { backgroundColor: colors.tint + "15" }]}
        >
          <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
            Back
          </ThemedText>
        </Pressable>

        <ThemedText type="title" style={styles.title}>
          Edit Book
        </ThemedText>

        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
          </ThemedView>
        ) : !book ? (
          <ThemedView style={styles.centerState}>
            <ThemedText type="subtitle">Book unavailable</ThemedText>
            <ThemedText style={[styles.message, { color: colors.tabIconDefault }]}>
              {message ?? "This book could not be loaded."}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
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

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Cover image
            </ThemedText>
            <ThemedView
              style={[
                styles.coverPicker,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
                  borderColor: colors.tint + "30",
                },
              ]}
            >
              {previewUrl ? (
                <Image
                  source={{ uri: previewUrl }}
                  style={styles.coverPreview}
                  contentFit="cover"
                />
              ) : (
                <ThemedText style={{ color: colors.tabIconDefault }}>
                  No cover selected
                </ThemedText>
              )}
            </ThemedView>
            <ThemedView style={styles.coverActions}>
              <Pressable
                onPress={handleChooseCover}
                style={[styles.secondaryButton, { borderColor: colors.icon }]}
              >
                <ThemedText type="defaultSemiBold">
                  {previewUrl ? "Change cover" : "Choose cover"}
                </ThemedText>
              </Pressable>
              {previewUrl ? (
                <Pressable
                  onPress={() => {
                    setCoverAsset(null);
                    setShouldRemoveCover(true);
                  }}
                  style={[styles.secondaryButton, { borderColor: colors.icon }]}
                >
                  <ThemedText type="defaultSemiBold">Remove</ThemedText>
                </Pressable>
              ) : null}
            </ThemedView>

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
                        backgroundColor: isActive
                          ? colors.tint
                          : colors.tint + "15",
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
                <ThemedText type="defaultSemiBold">Published</ThemedText>
                <ThemedText style={{ color: colors.tabIconDefault }}>
                  Published books appear on Home.
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
                <ThemedText style={styles.primaryButtonText}>Save changes</ThemedText>
              )}
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
  title: {
    fontSize: 30,
    marginBottom: 22,
  },
  helperText: {
    marginBottom: 22,
  },
  centerState: {
    alignItems: "center",
    paddingTop: 60,
  },
  input: {
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 48,
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
  coverPicker: {
    alignItems: "center",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    height: 180,
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  coverPreview: {
    height: "100%",
    width: "100%",
  },
  coverActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: "center",
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
