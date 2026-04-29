import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import {
  createDiscussionComment,
  loadGlobalBookDiscussion,
  softDeleteDiscussionComment,
  softDeleteGlobalBookDiscussion,
} from "@/src/lib/discussions";
import { getErrorMessage } from "@/src/lib/errors";
import type {
  DiscussionCommentNode,
  GlobalBookDiscussionWithComments,
} from "@/src/types/database";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CommentCard, ComposerSection, formatDate } from "./thread-ui";

type ReplyTarget =
  | {
      mode: "discussion";
    }
  | {
      mode: "comment";
      parentCommentId: string;
      replyToUserId?: string | null;
      label: string;
    };

export function DiscussionDetailScreen() {
  const { session } = useAuth();
  const { navigationState, navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const discussionId = navigationState.params?.discussionId;
  const globalBookId = navigationState.params?.globalBookId;
  const [discussion, setDiscussion] = useState<GlobalBookDiscussionWithComments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget>({ mode: "discussion" });
  const [composerHeight, setComposerHeight] = useState(190);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const surfaceColor = colorScheme === "dark" ? "#222225" : "#f8f8f8";
  const nestedSurfaceColor = colorScheme === "dark" ? "#202023" : "#f5f5f5";
  const inputBackgroundColor = colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0";

  const fetchDiscussion = useCallback(async () => {
    if (!discussionId) {
      setErrorMessage("No discussion selected.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loaded = await loadGlobalBookDiscussion(discussionId);

      if (!loaded) {
        setDiscussion(null);
        setErrorMessage("This discussion could not be found.");
      } else {
        setDiscussion(loaded);
      }
    } catch (error) {
      setDiscussion(null);
      setErrorMessage(getErrorMessage(error, "Could not load this discussion."));
    }

    setIsLoading(false);
  }, [discussionId]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  const preloadReplyPrefix = useCallback((label: string) => {
    const prefix = `@${label} `;

    setComposerText((currentText) => {
      const trimmedText = currentText.trim();

      if (!trimmedText || trimmedText.startsWith("@")) {
        return prefix;
      }

      return currentText;
    });
  }, []);

  const canDeleteDiscussion = Boolean(
    session?.user.id && discussion?.author_id === session.user.id,
  );

  const handleSubmit = async () => {
    if (!session) {
      navigateToScreen("user", "login");
      return;
    }

    if (!discussion) {
      return;
    }

    if (discussion.is_deleted) {
      setErrorMessage("Deleted discussions cannot receive new comments.");
      return;
    }

    if (!composerText.trim()) {
      setErrorMessage("Write something before posting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createDiscussionComment(session.user.id, {
        discussion_id: discussion.id,
        body: composerText,
        parent_comment_id:
          replyTarget.mode === "discussion" ? null : replyTarget.parentCommentId,
        reply_to_comment_id:
          replyTarget.mode === "discussion" ? null : replyTarget.parentCommentId,
        reply_to_user_id:
          replyTarget.mode === "discussion" ? null : replyTarget.replyToUserId ?? null,
      });

      setComposerText("");
      setReplyTarget({ mode: "discussion" });
      await fetchDiscussion();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not post this comment."));
    }

    setIsSubmitting(false);
  };

  const handleDeleteDiscussion = async () => {
    if (!discussion || !canDeleteDiscussion) {
      return;
    }

    try {
      await softDeleteGlobalBookDiscussion(discussion.id);
      await fetchDiscussion();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not delete this discussion."));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await softDeleteDiscussionComment(commentId);
      await fetchDiscussion();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not delete this comment."));
    }
  };

  const openCommentThread = (comment: DiscussionCommentNode) => {
    navigateToScreen("home", "comment-thread", {
      discussionId: discussionId ?? undefined,
      commentId: comment.id,
      parentCommentId: comment.parent_comment_id ?? undefined,
      ancestorPath: undefined,
      globalBookId,
    });
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.bottom}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: composerHeight + 20 },
          ]}
          style={styles.flex}
        >
          <Pressable
            onPress={() => navigateToScreen("home", "global-book", { globalBookId })}
            style={[styles.backButton, { backgroundColor: colors.tint + "15" }]}
          >
            <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
              Back to Global Book
            </ThemedText>
          </Pressable>

          {isLoading ? (
            <ThemedView style={styles.centerState}>
              <ActivityIndicator color={colors.tint} />
            </ThemedView>
          ) : errorMessage && !discussion ? (
            <ThemedView style={styles.centerState}>
              <ThemedText type="subtitle">Discussion unavailable</ThemedText>
              <ThemedText style={{ color: colors.tabIconDefault }}>
                {errorMessage}
              </ThemedText>
            </ThemedView>
          ) : discussion ? (
            <>
              <ThemedView
                style={[
                  styles.discussionCard,
                  {
                    backgroundColor: surfaceColor,
                  },
                ]}
              >
                <ThemedText type="title" style={styles.title}>
                  {discussion.is_deleted ? "Deleted discussion" : discussion.title}
                </ThemedText>
                <ThemedText style={{ color: colors.tabIconDefault }}>
                  {discussion.author?.display_name ?? "BookTrade reader"} ·{" "}
                  {formatDate(discussion.created_at)}
                </ThemedText>
                <ThemedText style={styles.bodyText}>
                  {discussion.is_deleted
                    ? "This discussion was deleted."
                    : discussion.body}
                </ThemedText>
                <ThemedText style={{ color: colors.tabIconDefault }}>
                  {discussion.comment_count} comment
                  {discussion.comment_count === 1 ? "" : "s"}
                </ThemedText>
                <View style={styles.postActions}>
                  {!discussion.is_deleted ? (
                    <Pressable
                      onPress={() => {
                        if (!session) {
                          navigateToScreen("user", "login");
                          return;
                        }

                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }}
                    >
                      <ThemedText type="link">Comment</ThemedText>
                    </Pressable>
                  ) : null}
                  {canDeleteDiscussion ? (
                    <Pressable onPress={handleDeleteDiscussion}>
                      <ThemedText type="link">Delete discussion</ThemedText>
                    </Pressable>
                  ) : null}
                </View>
              </ThemedView>

              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Comments
              </ThemedText>

              {discussion.root_comments.length === 0 ? (
                <ThemedView style={styles.emptyBox}>
                  <ThemedText type="defaultSemiBold">No comments yet</ThemedText>
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    Start the conversation on this global book.
                  </ThemedText>
                </ThemedView>
              ) : (
                discussion.root_comments.map((comment) => {
                  const canDeleteComment = Boolean(
                    session?.user.id && comment.author_id === session.user.id,
                  );

                  return (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      backgroundColor={nestedSurfaceColor}
                      mutedTextColor={colors.tabIconDefault}
                      onPressCard={() => openCommentThread(comment)}
                      onPressReply={() => {
                        setReplyTarget({
                          mode: "comment",
                          parentCommentId: comment.id,
                          replyToUserId: comment.author_id,
                          label: comment.author?.display_name ?? "this reader",
                        });
                        preloadReplyPrefix(
                          comment.author?.display_name ?? "this reader",
                        );
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }}
                      onPressDelete={
                        canDeleteComment ? () => handleDeleteComment(comment.id) : undefined
                      }
                      onPressReplies={
                        comment.child_count > 0 ? () => openCommentThread(comment) : undefined
                      }
                    />
                  );
                })
              )}
            </>
          ) : null}
        </ScrollView>

        {discussion && !discussion.is_deleted ? (
          <View
            style={[
              styles.composerDock,
              {
                paddingBottom: 0,
              },
            ]}
          >
            <ComposerSection
              replyContextLabel={
                replyTarget.mode === "discussion" ? null : replyTarget.label
              }
              onCancel={
                replyTarget.mode === "discussion"
                  ? undefined
                  : () => setReplyTarget({ mode: "discussion" })
              }
              placeholder="Add a comment"
              value={composerText}
              onChangeText={setComposerText}
              errorMessage={errorMessage}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              inputBackgroundColor={inputBackgroundColor}
              inputTextColor={colors.text}
              mutedTextColor={colors.tabIconDefault}
              buttonColor={colors.tint}
              onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  centerState: {
    alignItems: "center",
    gap: 10,
    paddingTop: 80,
  },
  discussionCard: {
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
    padding: 16,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
  },
  bodyText: {
    marginTop: 4,
  },
  postActions: {
    flexDirection: "row",
    gap: 18,
    marginTop: 6,
  },
  sectionTitle: {
    marginBottom: 14,
  },
  emptyBox: {
    borderRadius: 12,
    gap: 6,
    marginBottom: 24,
    padding: 16,
  },
  composerDock: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
});
