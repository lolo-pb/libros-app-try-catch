import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { resolveCoverSource } from "@/src/lib/book-covers";
import { getErrorMessage } from "@/src/lib/errors";
import { createGlobalBook, loadGlobalBooks } from "@/src/lib/global-books";
import { removeBookCover, uploadBookCover } from "@/src/lib/book-storage";
import { ensureProfileForUser } from "@/src/lib/profiles";
import { supabase } from "@/src/lib/supabase";
import type { Book, BookCondition, GlobalBook } from "@/src/types/database";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
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
  const globalBookIdFromParams = navigationState.params?.globalBookId;
  const returnSection =
    navigationState.params?.returnSection === "home" ? "home" : "books";
  const returnScreen = navigationState.params?.returnScreen;
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
  const [globalBooks, setGlobalBooks] = useState<GlobalBook[]>([]);
  const [globalBookSearch, setGlobalBookSearch] = useState("");
  const [selectedGlobalBook, setSelectedGlobalBook] = useState<GlobalBook | null>(
    null,
  );
  const [isCreatingGlobalBook, setIsCreatingGlobalBook] = useState(false);
  const [newGlobalBookTitle, setNewGlobalBookTitle] = useState("");
  const [newGlobalBookAuthor, setNewGlobalBookAuthor] = useState("");
  const [newGlobalBookEditorial, setNewGlobalBookEditorial] = useState("");
  const [newGlobalBookDescription, setNewGlobalBookDescription] = useState("");
  const [newGlobalBookCoverAsset, setNewGlobalBookCoverAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
      color: colors.text,
    },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadBookAndGlobalBooks() {
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

      try {
        const [bookResult, globalBookResult] = await Promise.all([
          supabase.from("books").select("*").eq("id", bookId).maybeSingle(),
          loadGlobalBooks(),
        ]);

        if (!isMounted) {
          return;
        }

        if (bookResult.error || !bookResult.data) {
          setMessage(bookResult.error?.message ?? "Book could not be found.");
        } else if (bookResult.data.owner_id !== session.user.id) {
          setMessage("Only the owner can edit this book.");
        } else {
          const loadedBook = bookResult.data;
          setBook(loadedBook);
          setTitle(loadedBook.title);
          setAuthor(loadedBook.author);
          setDescription(loadedBook.description ?? "");
          setCoverPath(loadedBook.cover_path);
          setCondition(loadedBook.condition);
          setIsPublished(loadedBook.is_published);
          setGlobalBooks(globalBookResult);
          const linkedGlobalBook =
            globalBookResult.find(
              (globalBook) => globalBook.id === loadedBook.global_book_id,
            ) ?? null;
          setSelectedGlobalBook(linkedGlobalBook);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(
            error instanceof Error ? error.message : "Could not load this book.",
          );
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    loadBookAndGlobalBooks();

    return () => {
      isMounted = false;
    };
  }, [bookId, session]);

  const filteredGlobalBooks = useMemo(() => {
    const query = globalBookSearch.trim().toLowerCase();

    if (!query) {
      return globalBooks;
    }

    return globalBooks.filter((globalBook) => {
      return (
        globalBook.title.toLowerCase().includes(query) ||
        globalBook.author.toLowerCase().includes(query)
      );
    });
  }, [globalBookSearch, globalBooks]);

  const handleChooseImage = async (
    onSelect: (asset: ImagePicker.ImagePickerAsset) => void,
  ) => {
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
      onSelect(result.assets[0]);
      setMessage(null);
    }
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
      await ensureProfileForUser(session.user);

      let globalBookId = selectedGlobalBook?.id ?? null;

      if (isCreatingGlobalBook) {
        if (!newGlobalBookTitle.trim() || !newGlobalBookAuthor.trim()) {
          setMessage("New global books need a title and author.");
          setIsSubmitting(false);
          return;
        }

        const uploadedGlobalBookCoverPath = newGlobalBookCoverAsset
          ? await uploadBookCover(
              session.user.id,
              newGlobalBookCoverAsset,
              "global-book",
            )
          : null;

        const createdGlobalBook = await createGlobalBook({
          title: newGlobalBookTitle,
          author: newGlobalBookAuthor,
          editorial: newGlobalBookEditorial,
          description: newGlobalBookDescription,
          cover_path: uploadedGlobalBookCoverPath,
          created_by: session.user.id,
        });

        globalBookId = createdGlobalBook.id;
      }

      const uploadedCoverPath = coverAsset
        ? await uploadBookCover(session.user.id, coverAsset)
        : null;
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
          global_book_id: globalBookId,
          is_published: isPublished,
          title: title.trim(),
        })
        .eq("id", book.id);

      if (error) {
        setMessage(error.message);
      } else {
        if (uploadedCoverPath || shouldRemoveCover) {
          await removeBookCover(coverPath);
        }
        navigateToScreen(returnSection, "book", {
          bookId: book.id,
          globalBookId: globalBookId ?? globalBookIdFromParams,
          returnScreen,
        });
      }
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not save this book."));
    }

    setIsSubmitting(false);
  };

  const previewSource = coverAsset
    ? { uri: coverAsset.uri }
    : shouldRemoveCover
      ? null
      : resolveCoverSource({ cover_path: coverPath });

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
            navigateToScreen(returnSection, "book", {
              bookId,
              globalBookId: globalBookIdFromParams,
              returnScreen,
            })
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
              {previewSource ? (
                <Image source={previewSource} style={styles.coverPreview} contentFit="cover" />
              ) : (
                <ThemedText style={{ color: colors.tabIconDefault }}>
                  No cover selected
                </ThemedText>
              )}
            </ThemedView>
            <ThemedView style={styles.coverActions}>
              <Pressable
                onPress={() => handleChooseImage(setCoverAsset)}
                style={[styles.secondaryButton, { borderColor: colors.icon }]}
              >
                <ThemedText type="defaultSemiBold">
                  {previewSource ? "Change cover" : "Choose cover"}
                </ThemedText>
              </Pressable>
              {previewSource ? (
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
              Link to global book
            </ThemedText>
            {selectedGlobalBook ? (
              <ThemedView
                style={[
                  styles.linkedBox,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#2c2c2e" : "#f6f6f6",
                  },
                ]}
              >
                <ThemedText type="defaultSemiBold">
                  {selectedGlobalBook.title}
                </ThemedText>
                <ThemedText style={{ color: colors.tabIconDefault }}>
                  {selectedGlobalBook.author}
                </ThemedText>
                <Pressable onPress={() => setSelectedGlobalBook(null)}>
                  <ThemedText type="link">Clear selection</ThemedText>
                </Pressable>
              </ThemedView>
            ) : (
              <>
                <TextInput
                  placeholder="Search global books"
                  placeholderTextColor={colors.tabIconDefault}
                  value={globalBookSearch}
                  onChangeText={setGlobalBookSearch}
                  style={inputStyle}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.globalBookList}
                >
                  {filteredGlobalBooks.map((globalBook) => (
                    <Pressable
                      key={globalBook.id}
                      onPress={() => {
                        setSelectedGlobalBook(globalBook);
                        setIsCreatingGlobalBook(false);
                      }}
                      style={[
                        styles.globalBookCard,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#2c2c2e" : "#f6f6f6",
                        },
                      ]}
                    >
                      <Image
                        source={resolveCoverSource(globalBook)}
                        style={styles.globalBookCover}
                        contentFit="cover"
                      />
                      <ThemedText type="defaultSemiBold" numberOfLines={2}>
                        {globalBook.title}
                      </ThemedText>
                      <ThemedText
                        numberOfLines={1}
                        style={{ color: colors.tabIconDefault }}
                      >
                        {globalBook.author}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable
                  onPress={() => {
                    setIsCreatingGlobalBook(true);
                    setNewGlobalBookTitle(title);
                    setNewGlobalBookAuthor(author);
                  }}
                >
                  <ThemedText type="link">Create a new global book</ThemedText>
                </Pressable>
              </>
            )}

            {isCreatingGlobalBook ? (
              <ThemedView style={styles.globalBookForm}>
                <ThemedText type="defaultSemiBold">New global book</ThemedText>
                <TextInput
                  placeholder="Global book title"
                  placeholderTextColor={colors.tabIconDefault}
                  value={newGlobalBookTitle}
                  onChangeText={setNewGlobalBookTitle}
                  style={inputStyle}
                />
                <TextInput
                  placeholder="Global book author"
                  placeholderTextColor={colors.tabIconDefault}
                  value={newGlobalBookAuthor}
                  onChangeText={setNewGlobalBookAuthor}
                  style={inputStyle}
                />
                <TextInput
                  placeholder="Editorial"
                  placeholderTextColor={colors.tabIconDefault}
                  value={newGlobalBookEditorial}
                  onChangeText={setNewGlobalBookEditorial}
                  style={inputStyle}
                />
                <TextInput
                  multiline
                  placeholder="Global book description"
                  placeholderTextColor={colors.tabIconDefault}
                  value={newGlobalBookDescription}
                  onChangeText={setNewGlobalBookDescription}
                  style={[inputStyle, styles.textArea]}
                />
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
                  {newGlobalBookCoverAsset ? (
                    <Image
                      source={{ uri: newGlobalBookCoverAsset.uri }}
                      style={styles.coverPreview}
                      contentFit="cover"
                    />
                  ) : (
                    <ThemedText style={{ color: colors.tabIconDefault }}>
                      No global book cover selected
                    </ThemedText>
                  )}
                </ThemedView>
                <ThemedView style={styles.coverActions}>
                  <Pressable
                    onPress={() => handleChooseImage(setNewGlobalBookCoverAsset)}
                    style={[styles.secondaryButton, { borderColor: colors.icon }]}
                  >
                    <ThemedText type="defaultSemiBold">
                      {newGlobalBookCoverAsset ? "Change cover" : "Choose cover"}
                    </ThemedText>
                  </Pressable>
                  {newGlobalBookCoverAsset ? (
                    <Pressable
                      onPress={() => setNewGlobalBookCoverAsset(null)}
                      style={[styles.secondaryButton, { borderColor: colors.icon }]}
                    >
                      <ThemedText type="defaultSemiBold">Remove</ThemedText>
                    </Pressable>
                  ) : null}
                </ThemedView>
                <Pressable onPress={() => setIsCreatingGlobalBook(false)}>
                  <ThemedText type="link">Cancel new global book</ThemedText>
                </Pressable>
              </ThemedView>
            ) : null}

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
                  Published books appear on their global book page.
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
  linkedBox: {
    borderRadius: 10,
    gap: 6,
    marginBottom: 18,
    padding: 14,
  },
  globalBookList: {
    gap: 12,
    paddingBottom: 8,
    paddingRight: 20,
  },
  globalBookCard: {
    borderRadius: 12,
    gap: 8,
    padding: 12,
    width: 150,
  },
  globalBookCover: {
    borderRadius: 10,
    height: 150,
    width: "100%",
  },
  globalBookForm: {
    marginTop: 14,
    marginBottom: 18,
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
