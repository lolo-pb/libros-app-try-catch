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
  DiscussionCommentWithAuthor,
  GlobalBookDiscussionWithComments,
} from "@/src/types/database";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReplyTarget =
  | {
      mode: "discussion";
    }
  | {
      mode: "comment";
      parentCommentId: string;
      replyToCommentId: string;
      replyToUserId?: string | null;
      label: string;
    };

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

export function DiscussionDetailScreen() {
  const { session } = useAuth();
  const { navigationState, navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const discussionId = navigationState.params?.discussionId;
  const globalBookId = navigationState.params?.globalBookId;
  const [discussion, setDiscussion] = useState<GlobalBookDiscussionWithComments | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget>({ mode: "discussion" });
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
      color: colors.text,
    },
  ];

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
        setErrorMessage("This discussion could not be found.");
        setDiscussion(null);
      } else {
        setDiscussion(loaded);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load this discussion."));
      setDiscussion(null);
    }

    setIsLoading(false);
  }, [discussionId]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  const canDeleteDiscussion = Boolean(
    session?.user.id && discussion?.author_id === session.user.id,
  );

  const composerPlaceholder = useMemo(() => {
    if (replyTarget.mode === "discussion") {
      return "Add a comment";
    }
    return `Reply to ${replyTarget.label}`;
  }, [replyTarget]);

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
      if (replyTarget.mode === "discussion") {
        await createDiscussionComment(session.user.id, {
          discussion_id: discussion.id,
          body: composerText,
        });
      } else {
        await createDiscussionComment(session.user.id, {
          discussion_id: discussion.id,
          body: composerText,
          parent_comment_id: replyTarget.parentCommentId,
          reply_to_comment_id: replyTarget.replyToCommentId,
          reply_to_user_id: replyTarget.replyToUserId ?? null,
        });
        setExpandedReplies((current) => ({
          ...current,
          [replyTarget.parentCommentId]: true,
        }));
      }

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

  const openReplyComposer = (
    topLevelComment: DiscussionCommentWithAuthor,
    targetComment: DiscussionCommentWithAuthor,
  ) => {
    if (discussion?.is_deleted) {
      return;
    }

    if (!session) {
      navigateToScreen("user", "login");
      return;
    }

    setReplyTarget({
      mode: "comment",
      parentCommentId: topLevelComment.id,
      replyToCommentId: targetComment.id,
      replyToUserId: targetComment.author_id,
      label:
        targetComment.author?.display_name ??
        targetComment.reply_to_user?.display_name ??
        "this reader",
    });
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
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
                  backgroundColor:
                    colorScheme === "dark" ? "#222225" : "#f8f8f8",
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
              <ThemedView style={styles.postActions}>
                {!discussion.is_deleted ? (
                  <Pressable
                    onPress={() => {
                      if (!session) {
                        navigateToScreen("user", "login");
                        return;
                      }
                      setReplyTarget({ mode: "discussion" });
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
              </ThemedView>
            </ThemedView>

            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Comments
            </ThemedText>

            {discussion.top_level_comments.length === 0 ? (
              <ThemedView style={styles.emptyBox}>
                <ThemedText type="defaultSemiBold">No comments yet</ThemedText>
                <ThemedText style={{ color: colors.tabIconDefault }}>
                  Start the conversation on this global book.
                </ThemedText>
              </ThemedView>
            ) : (
              discussion.top_level_comments.map((comment) => {
                const isExpanded = expandedReplies[comment.id] ?? false;
                const canDeleteComment = Boolean(
                  session?.user.id && comment.author_id === session.user.id,
                );

                return (
                  <ThemedView
                    key={comment.id}
                    style={[styles.commentCard, { borderColor: colors.icon }]}
                  >
                    <ThemedText type="defaultSemiBold">
                      {comment.author?.display_name ?? "BookTrade reader"}
                    </ThemedText>
                    <ThemedText style={{ color: colors.tabIconDefault }}>
                      {formatDate(comment.created_at)}
                    </ThemedText>
                    <ThemedText style={styles.commentBody}>
                      {comment.is_deleted
                        ? "This comment was deleted."
                        : comment.body}
                    </ThemedText>

                    <ThemedView style={styles.commentActions}>
                      {!comment.is_deleted ? (
                        <Pressable onPress={() => openReplyComposer(comment, comment)}>
                          <ThemedText type="link">Reply</ThemedText>
                        </Pressable>
                      ) : null}
                      {canDeleteComment ? (
                        <Pressable onPress={() => handleDeleteComment(comment.id)}>
                          <ThemedText type="link">Delete</ThemedText>
                        </Pressable>
                      ) : null}
                    </ThemedView>

                    {comment.reply_count > 0 ? (
                      <>
                        <Pressable
                          onPress={() =>
                            setExpandedReplies((current) => ({
                              ...current,
                              [comment.id]: !isExpanded,
                            }))
                          }
                          style={styles.replyToggle}
                        >
                          <ThemedText type="link">
                            {isExpanded
                              ? "Hide replies"
                              : `View replies (${comment.reply_count})`}
                          </ThemedText>
                        </Pressable>

                        {isExpanded ? (
                          <ThemedView style={styles.replyList}>
                            {comment.replies.map((reply) => {
                              const canDeleteReply = Boolean(
                                session?.user.id && reply.author_id === session.user.id,
                              );

                              return (
                                <ThemedView
                                  key={reply.id}
                                  style={[
                                    styles.replyCard,
                                    {
                                      backgroundColor:
                                        colorScheme === "dark"
                                          ? "#202023"
                                          : "#f5f5f5",
                                    },
                                  ]}
                                >
                                  <ThemedText type="defaultSemiBold">
                                    {reply.author?.display_name ?? "BookTrade reader"}
                                  </ThemedText>
                                  <ThemedText
                                    style={{ color: colors.tabIconDefault }}
                                  >
                                    {formatDate(reply.created_at)}
                                  </ThemedText>
                                  <ThemedText style={styles.commentBody}>
                                    {reply.reply_to_user?.display_name
                                      ? `@${reply.reply_to_user.display_name} `
                                      : ""}
                                    {reply.body ?? ""}
                                  </ThemedText>
                                  <ThemedView style={styles.commentActions}>
                                    {!discussion.is_deleted ? (
                                      <Pressable
                                        onPress={() => openReplyComposer(comment, reply)}
                                      >
                                        <ThemedText type="link">Reply</ThemedText>
                                      </Pressable>
                                    ) : null}
                                    {canDeleteReply ? (
                                      <Pressable
                                        onPress={() => handleDeleteComment(reply.id)}
                                      >
                                        <ThemedText type="link">Delete</ThemedText>
                                      </Pressable>
                                    ) : null}
                                  </ThemedView>
                                </ThemedView>
                              );
                            })}
                          </ThemedView>
                        ) : null}
                      </>
                    ) : null}
                  </ThemedView>
                );
              })
            )}

            {!discussion.is_deleted ? (
              <ThemedView style={styles.composerSection}>
                <ThemedText type="defaultSemiBold">
                  {replyTarget.mode === "discussion"
                    ? "Add a comment"
                    : `Replying to ${replyTarget.label}`}
                </ThemedText>
                {replyTarget.mode !== "discussion" ? (
                  <Pressable onPress={() => setReplyTarget({ mode: "discussion" })}>
                    <ThemedText type="link">Cancel reply</ThemedText>
                  </Pressable>
                ) : null}
                <TextInput
                  multiline
                  placeholder={composerPlaceholder}
                  placeholderTextColor={colors.tabIconDefault}
                  value={composerText}
                  onChangeText={setComposerText}
                  style={[inputStyle, styles.textArea]}
                />
                {errorMessage ? (
                  <ThemedText style={{ color: colors.tabIconDefault }}>
                    {errorMessage}
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
                    <ThemedText style={styles.primaryButtonText}>Post</ThemedText>
                  )}
                </Pressable>
              </ThemedView>
            ) : null}
          </>
        ) : null}
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
  commentCard: {
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    marginBottom: 14,
    padding: 14,
  },
  commentBody: {
    marginTop: 4,
  },
  commentActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 6,
  },
  replyToggle: {
    marginTop: 8,
  },
  replyList: {
    gap: 10,
    marginTop: 10,
    paddingLeft: 14,
  },
  replyCard: {
    borderRadius: 10,
    gap: 4,
    padding: 12,
  },
  composerSection: {
    gap: 10,
    marginTop: 18,
  },
  input: {
    borderRadius: 8,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
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
