import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { getErrorMessage } from "@/src/lib/errors";
import { createGlobalBookDiscussion } from "@/src/lib/discussions";
import { loadGlobalBook } from "@/src/lib/global-books";
import type { GlobalBookWithBooks } from "@/src/types/database";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function NewDiscussionScreen() {
  const { session } = useAuth();
  const { navigationState, navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const globalBookId = navigationState.params?.globalBookId;
  const [globalBook, setGlobalBook] = useState<GlobalBookWithBooks | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
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

    async function fetchGlobalBook() {
      if (!globalBookId) {
        setMessage("No topic selected.");
        setIsLoading(false);
        return;
      }

      try {
        const loaded = await loadGlobalBook(globalBookId);

        if (!isMounted) {
          return;
        }

        if (!loaded) {
          setMessage("This topic could not be found.");
        } else {
          setGlobalBook(loaded);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(getErrorMessage(error, "Could not load this topic."));
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    fetchGlobalBook();

    return () => {
      isMounted = false;
    };
  }, [globalBookId]);

  const handleSubmit = async () => {
    if (!session) {
      navigateToScreen("user", "login");
      return;
    }

    if (!globalBookId) {
      setMessage("No topic selected.");
      return;
    }

    if (!title.trim() || !body.trim()) {
      setMessage("Add a title and a message to start the discussion.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const discussion = await createGlobalBookDiscussion({
        global_book_id: globalBookId,
        author_id: session.user.id,
        title,
        body,
      });

      navigateToScreen("home", "discussion-detail", {
        discussionId: discussion.id,
        globalBookId,
      });
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not create the discussion."));
    }

    setIsSubmitting(false);
  };

  if (!session) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ThemedView style={styles.centerState}>
          <ThemedText type="title">New Discussion</ThemedText>
          <ThemedText style={{ color: colors.tabIconDefault }}>
            Sign in to start a discussion.
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
      <Pressable
        onPress={() => navigateToScreen("home", "global-book", { globalBookId })}
        style={[
          styles.backButton,
          { backgroundColor: colorScheme === "dark" ? "#3a3a3acc" : "#e6e6e6cc" },
        ]}
      >
        <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
          Back to Topic
        </ThemedText>
      </Pressable>

      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator color={colors.tint} />
          </ThemedView>
        ) : (
          <>
            <ThemedText type="title" style={styles.title}>
              Start Discussion
            </ThemedText>
            <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
              {globalBook
                ? `Starting a discussion for ${globalBook.title}.`
                : "Start a discussion for this topic."}
            </ThemedText>

            <TextInput
              placeholder="Discussion title"
              placeholderTextColor={colors.tabIconDefault}
              value={title}
              onChangeText={setTitle}
              style={[inputStyle, styles.titleInput]}
            />
            <TextInput
              multiline
              placeholder="What do you want to talk about?"
              placeholderTextColor={colors.tabIconDefault}
              value={body}
              onChangeText={setBody}
              style={[inputStyle, styles.textArea]}
            />

            {message ? (
              <ThemedText style={[styles.messageText, { color: colors.tabIconDefault }]}>
                {message}
              </ThemedText>
            ) : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>
                  Publish discussion
                </ThemedText>
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
    paddingTop: 72,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    padding: 24,
  },
  backButton: {
    borderRadius: 8,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    top: 12,
    zIndex: 20,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  titleInput: {
    marginBottom: 12,
  },
  textArea: {
    minHeight: 160,
    textAlignVertical: "top",
  },
  messageText: {
    marginTop: 12,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    marginTop: 18,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
