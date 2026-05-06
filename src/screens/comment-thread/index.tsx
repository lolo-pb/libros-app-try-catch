import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import {
  createDiscussionComment,
  loadDiscussionCommentThread,
  softDeleteDiscussionComment,
} from "@/src/lib/discussions";
import { getErrorMessage } from "@/src/lib/errors";
import type {
  DiscussionCommentNode,
  DiscussionCommentThread,
} from "@/src/types/database";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CommentCard, ComposerSection } from "../discussion-detail/thread-ui";

type ReplyTarget =
  | {
    mode: "focused";
  }
  | {
    mode: "comment";
    replyToCommentId: string;
    replyToUserId?: string | null;
    label: string;
  };

export function CommentThreadScreen() {
  const { session } = useAuth();
  const { navigationState, navigateToScreen, goBack } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const discussionId = navigationState.params?.discussionId;
  const commentId = navigationState.params?.commentId;
  const ancestorPath = navigationState.params?.ancestorPath;
  const globalBookId = navigationState.params?.globalBookId;
  const [thread, setThread] = useState<DiscussionCommentThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget>({ mode: "focused" });
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  const [composerHeight, setComposerHeight] = useState(190);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const surfaceColor = colorScheme === "dark" ? "#222225" : "#f8f8f8";
  const nestedSurfaceColor = colorScheme === "dark" ? "#202023" : "#f5f5f5";
  const inputBackgroundColor = colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0";

  const fetchThread = useCallback(async () => {
    if (!discussionId || !commentId) {
      setErrorMessage("No comment selected.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loaded = await loadDiscussionCommentThread(discussionId, commentId);

      if (!loaded) {
        setThread(null);
        setErrorMessage("This comment thread could not be found.");
      } else {
        setThread(loaded);
        setHasAutoScrolled(false);
      }
    } catch (error) {
      setThread(null);
      setErrorMessage(getErrorMessage(error, "Could not load this comment thread."));
    }

    setIsLoading(false);
  }, [commentId, discussionId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchThread();
    setIsRefreshing(false);
  }, [fetchThread]);

  const composerPlaceholder = useMemo(() => {
    if (replyTarget.mode === "focused") {
      return "Reply to this comment";
    }

    return `Reply to ${replyTarget.label}`;
  }, [replyTarget]);

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

  const handleSubmit = async () => {
    if (!session) {
      navigateToScreen("user", "login");
      return;
    }

    if (!thread) {
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
        discussion_id: thread.discussion.id,
        body: composerText,
        parent_comment_id:
          replyTarget.mode === "focused"
            ? thread.focused_comment.id
            : replyTarget.replyToCommentId,
        reply_to_comment_id:
          replyTarget.mode === "focused"
            ? thread.focused_comment.id
            : replyTarget.replyToCommentId,
        reply_to_user_id:
          replyTarget.mode === "focused"
            ? thread.focused_comment.author_id
            : replyTarget.replyToUserId ?? null,
      });

      setComposerText("");
      setReplyTarget({ mode: "focused" });
      await fetchThread();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not post this reply."));
    }

    setIsSubmitting(false);
  };

  const handleDeleteComment = async (targetCommentId: string) => {
    try {
      await softDeleteDiscussionComment(targetCommentId);
      await fetchThread();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not delete this comment."));
    }
  };

  const buildChildAncestorPath = () =>
    ancestorPath
      ? `${ancestorPath},${thread?.focused_comment.id ?? ""}`
      : thread?.focused_comment.id;

  const openCommentThread = (
    targetComment: DiscussionCommentNode,
    nextAncestorPath?: string,
  ) => {
    navigateToScreen("home", "comment-thread", {
      discussionId: discussionId ?? undefined,
      commentId: targetComment.id,
      parentCommentId: targetComment.parent_comment_id ?? undefined,
      ancestorPath: nextAncestorPath,
      globalBookId,
    });
  };

  const canDeleteFocusedComment = Boolean(
    session?.user.id && thread?.focused_comment.author_id === session.user.id,
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 0}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollViewRef}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
          contentContainerStyle={[
            styles.container,
            {
              paddingBottom:
                composerHeight +
                20 +
                (Platform.OS === "android" ? keyboardHeight : 0),
            },
          ]}
          style={styles.flex}
        >
          <Pressable
            onPress={() => {
              if (navigationState.history?.length) {
                goBack();
                return;
              }

              navigateToScreen("home", "global-book", { globalBookId });
            }}
            style={[styles.backButton, { backgroundColor: colors.tint + "15" }]}
          >
            <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
              Back
            </ThemedText>
          </Pressable>

          {isLoading ? (
            <ThemedView style={styles.centerState}>
              <ActivityIndicator color={colors.tint} />
            </ThemedView>
          ) : errorMessage && !thread ? (
            <ThemedView style={styles.centerState}>
              <ThemedText type="subtitle">Comment thread unavailable</ThemedText>
              <ThemedText style={{ color: colors.tabIconDefault }}>
                {errorMessage}
              </ThemedText>
            </ThemedView>
          ) : thread ? (
            <>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Thread
              </ThemedText>

              <ThemedView
                style={[
                  styles.discussionCard,
                  {
                    backgroundColor: nestedSurfaceColor,
                  },
                ]}
              >
                <Pressable
                  onPress={() =>
                    navigateToScreen("home", "discussion-detail", {
                      discussionId: thread.discussion.id,
                      globalBookId,
                    })
                  }
                  style={styles.discussionTapArea}
                >
                  <ThemedText type="defaultSemiBold">Discussion</ThemedText>
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    {thread.discussion.author?.display_name ?? "BookTrade reader"} ·{" "}
                    {new Date(thread.discussion.created_at).toLocaleDateString()}
                  </ThemedText>
                  <ThemedText style={styles.discussionBody}>
                    {thread.discussion.is_deleted
                      ? "This discussion was deleted."
                      : thread.discussion.body}
                  </ThemedText>
                </Pressable>
              </ThemedView>

              {thread.ancestor_comments.map((comment, index) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  backgroundColor={nestedSurfaceColor}
                  mutedTextColor={colors.tabIconDefault}
                  onPressCard={() =>
                    openCommentThread(
                      comment,
                      index === 0
                        ? undefined
                        : thread.ancestor_comments
                          .slice(0, index)
                          .map((ancestor) => ancestor.id)
                          .join(","),
                    )
                  }
                  onPressReplies={
                    comment.child_count > 0
                      ? () =>
                        openCommentThread(
                          comment,
                          index === 0
                            ? undefined
                            : thread.ancestor_comments
                              .slice(0, index)
                              .map((ancestor) => ancestor.id)
                              .join(","),
                        )
                      : undefined
                  }
                />
              ))}

              <View style={styles.focusDivider}>
                <View
                  style={[
                    styles.focusDividerLine,
                    { backgroundColor: colors.icon + "88" },
                  ]}
                />
                <ThemedText
                  style={{ color: colors.tabIconDefault, fontWeight: "600" }}
                >
                  Focused comment
                </ThemedText>
                <View
                  style={[
                    styles.focusDividerLine,
                    { backgroundColor: colors.icon + "88" },
                  ]}
                />
              </View>

              <View
                onLayout={(event) => {
                  if (hasAutoScrolled) {
                    return;
                  }

                  scrollViewRef.current?.scrollTo({
                    y: Math.max(0, event.nativeEvent.layout.y - 16),
                    animated: false,
                  });
                  setHasAutoScrolled(true);
                }}
              >
                <CommentCard
                  comment={thread.focused_comment}
                  backgroundColor={surfaceColor}
                  mutedTextColor={colors.tabIconDefault}
                  onPressDelete={
                    canDeleteFocusedComment
                      ? () => handleDeleteComment(thread.focused_comment.id)
                      : undefined
                  }
                  highlight
                />
              </View>

              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Replies
              </ThemedText>

              {thread.child_comments.length === 0 ? (
                <ThemedView style={styles.emptyBox}>
                  <ThemedText type="defaultSemiBold">No replies yet</ThemedText>
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    Start this branch of the conversation.
                  </ThemedText>
                </ThemedView>
              ) : (
                thread.child_comments.map((comment) => {
                  const canDeleteComment = Boolean(
                    session?.user.id && comment.author_id === session.user.id,
                  );

                  return (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      backgroundColor={nestedSurfaceColor}
                      mutedTextColor={colors.tabIconDefault}
                      onPressCard={() =>
                        openCommentThread(comment, buildChildAncestorPath())
                      }
                      onPressReply={() => {
                        setReplyTarget({
                          mode: "comment",
                          replyToCommentId: comment.id,
                          replyToUserId: comment.author_id,
                          label: comment.author?.display_name ?? "this reader",
                        });
                        preloadReplyPrefix(
                          comment.author?.display_name ?? "this reader",
                        );
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }
                      }
                      onPressDelete={
                        canDeleteComment ? () => handleDeleteComment(comment.id) : undefined
                      }
                      onPressReplies={
                        comment.child_count > 0
                          ? () => openCommentThread(comment, buildChildAncestorPath())
                          : undefined
                      }
                    />
                  );
                })
              )}
            </>
          ) : null}
        </ScrollView>

        {thread ? (
          <View
            style={[
              styles.composerDock,
              {
                bottom: Platform.OS === "android" ? Math.max(0, keyboardHeight - 55) : 0,
              },
            ]}
          >
            <ComposerSection
              replyContextLabel={
                replyTarget.mode === "focused" ? null : replyTarget.label
              }
              onCancel={
                replyTarget.mode === "focused"
                  ? undefined
                  : () => setReplyTarget({ mode: "focused" })
              }
              placeholder={composerPlaceholder}
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
  sectionTitle: {
    marginBottom: 14,
  },
  discussionCard: {
    borderRadius: 12,
    gap: 8,
    marginBottom: 14,
    padding: 16,
  },
  discussionTapArea: {
    gap: 8,
  },
  discussionBody: {
    marginTop: 4,
  },
  focusDivider: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    marginTop: 2,
  },
  focusDividerLine: {
    flex: 1,
    height: 1,
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
