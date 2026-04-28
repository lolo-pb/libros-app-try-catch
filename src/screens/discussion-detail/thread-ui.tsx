import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import type { DiscussionCommentNode } from "@/src/types/database";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

type CommentCardProps = {
  comment: DiscussionCommentNode;
  backgroundColor?: string;
  mutedTextColor: string;
  onPressCard?: () => void;
  onPressReply?: () => void;
  onPressDelete?: () => void;
  onPressReplies?: () => void;
  highlight?: boolean;
  children?: React.ReactNode;
};

export function CommentCard({
  comment,
  backgroundColor,
  mutedTextColor,
  onPressCard,
  onPressReply,
  onPressDelete,
  onPressReplies,
  highlight = false,
  children,
}: CommentCardProps) {
  const content = (
    <>
      <ThemedText type="defaultSemiBold">
        {comment.author?.display_name ?? "BookTrade reader"}
      </ThemedText>
      <ThemedText style={{ color: mutedTextColor }}>
        {formatDate(comment.created_at)}
      </ThemedText>
      <ThemedText style={styles.commentBody}>
        {comment.reply_to_user?.display_name ? `@${comment.reply_to_user.display_name} ` : ""}
        {comment.is_deleted ? "This comment was deleted." : comment.body}
      </ThemedText>
    </>
  );

  return (
    <ThemedView
      style={[
        styles.commentCard,
        backgroundColor ? { backgroundColor } : null,
        highlight ? styles.highlightCard : null,
      ]}
    >
      {onPressCard ? (
        <Pressable onPress={onPressCard} style={styles.cardTapArea}>
          {content}
        </Pressable>
      ) : (
        content
      )}

      {(onPressReply || onPressDelete) && !comment.is_deleted ? (
        <View style={styles.commentActions}>
          {onPressReply ? (
            <Pressable onPress={onPressReply}>
              <ThemedText type="link">Reply</ThemedText>
            </Pressable>
          ) : null}
          {onPressDelete ? (
            <Pressable onPress={onPressDelete}>
              <ThemedText type="link">Delete</ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {comment.child_count > 0 && onPressReplies ? (
        <Pressable onPress={onPressReplies} style={styles.replyToggle}>
          <ThemedText type="link">
            {comment.child_count} Repl
            {comment.child_count === 1 ? "y" : "ies"}
          </ThemedText>
        </Pressable>
      ) : null}

      {children}
    </ThemedView>
  );
}

type ComposerSectionProps = {
  title: string;
  canCancel?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  errorMessage?: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  inputBackgroundColor: string;
  inputTextColor: string;
  mutedTextColor: string;
  buttonColor: string;
};

export function ComposerSection({
  title,
  canCancel = false,
  cancelLabel = "Cancel reply",
  onCancel,
  placeholder,
  value,
  onChangeText,
  errorMessage,
  isSubmitting,
  onSubmit,
  inputBackgroundColor,
  inputTextColor,
  mutedTextColor,
  buttonColor,
}: ComposerSectionProps) {
  return (
    <ThemedView style={styles.composerSection}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      {canCancel && onCancel ? (
        <Pressable onPress={onCancel}>
          <ThemedText type="link">{cancelLabel}</ThemedText>
        </Pressable>
      ) : null}
      <TextInput
        multiline
        placeholder={placeholder}
        placeholderTextColor={mutedTextColor}
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: inputBackgroundColor,
            color: inputTextColor,
          },
        ]}
      />
      {errorMessage ? (
        <ThemedText style={{ color: mutedTextColor }}>{errorMessage}</ThemedText>
      ) : null}
      <Pressable
        disabled={isSubmitting}
        onPress={onSubmit}
        style={[styles.primaryButton, { backgroundColor: buttonColor }]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.primaryButtonText}>Post</ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  highlightCard: {
    borderWidth: 0,
  },
  cardTapArea: {
    gap: 4,
  },
  commentCard: {
    borderRadius: 10,
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
