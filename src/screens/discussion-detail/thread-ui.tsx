import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import type { DiscussionCommentNode } from "@/src/types/database";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  type LayoutChangeEvent,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const content = (
    <>
      <View style={styles.headerRow}>
        <ThemedText type="defaultSemiBold">
          {comment.author?.display_name ?? "BookTrade reader"}
        </ThemedText>
        {onPressDelete ? (
          <View style={styles.menuWrapper}>
            <Pressable
              hitSlop={8}
              onPress={() => setIsMenuOpen((currentValue) => !currentValue)}
              style={styles.menuButton}
            >
              <ThemedText style={styles.menuDots}>...</ThemedText>
            </Pressable>
            {isMenuOpen ? (
              <Pressable
                onPress={() => {
                  setIsMenuOpen(false);
                  onPressDelete();
                }}
                style={styles.menuPanel}
              >
                <IconSymbol name="trash.fill" size={16} color="#d11a2a" />
                <ThemedText numberOfLines={1} style={styles.menuDeleteText}>
                  Delete
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
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

      {(onPressReply || comment.child_count > 0) && !comment.is_deleted ? (
        <View style={styles.commentActions}>
          {onPressReply ? (
            <Pressable onPress={onPressReply}>
              <ThemedText type="link">
                {comment.child_count > 0
                  ? `${comment.child_count} Repl${comment.child_count === 1 ? "y" : "ies"}`
                  : "Reply"}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {children}
    </ThemedView>
  );
}

type ComposerSectionProps = {
  replyContextLabel?: string | null;
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
  surfaceColor?: string;
  onLayout?: (event: LayoutChangeEvent) => void;
};

export function ComposerSection({
  replyContextLabel,
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
  surfaceColor,
  onLayout,
}: ComposerSectionProps) {
  const [inputHeight, setInputHeight] = useState(38);

  return (
    <ThemedView onLayout={onLayout} style={styles.composerSection}>
      <View
        style={[
          styles.composerBar,
          {
            backgroundColor: inputBackgroundColor,
          },
        ]}
      >
        <View style={styles.inputColumn}>
          {replyContextLabel ? (
            <View style={styles.replyContextRow}>
              <ThemedText
                numberOfLines={1}
                style={[styles.replyContextText, { color: mutedTextColor }]}
              >
                Replying to {replyContextLabel}
              </ThemedText>
              {onCancel ? (
                <Pressable onPress={onCancel} hitSlop={8}>
                  <ThemedText type="link" style={styles.cancelReplyText}>
                    Cancel
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <TextInput
            multiline
            placeholder={placeholder}
            placeholderTextColor={mutedTextColor}
            value={value}
            onChangeText={onChangeText}
            onContentSizeChange={(event) => {
              const nextHeight = Math.max(
                38,
                Math.min(108, Math.ceil(event.nativeEvent.contentSize.height)),
              );
              setInputHeight(nextHeight);
            }}
            style={[
              styles.input,
              {
                color: inputTextColor,
                height: inputHeight,
              },
            ]}
          />
        </View>
        <Pressable
          disabled={isSubmitting}
          onPress={onSubmit}
          style={[
            styles.sendButton,
            { backgroundColor: buttonColor },
            isSubmitting ? styles.sendButtonDisabled : null,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <IconSymbol name="paperplane.fill" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
      {errorMessage ? (
        <ThemedText style={[styles.errorText, { color: mutedTextColor }]}>
          {errorMessage}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
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
  menuButton: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  menuDots: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 18,
  },
  menuPanel: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d0d0d0",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
    minWidth: 78,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    right: 0,
    top: 24,
    zIndex: 10,
  },
  menuDeleteText: {
    color: "#d11a2a",
    flexShrink: 0,
    includeFontPadding: false,
  },
  menuWrapper: {
    alignItems: "flex-end",
    minWidth: 24,
    position: "relative",
  },
  composerSection: {
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  composerBar: {
    alignItems: "flex-end",
    borderRadius: 22,
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inputColumn: {
    flex: 1,
    gap: 6,
  },
  replyContextRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 4,
  },
  replyContextText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 16,
  },
  cancelReplyText: {
    fontSize: 13,
    lineHeight: 16,
  },
  input: {
    borderRadius: 18,
    fontSize: 16,
    maxHeight: 108,
    minHeight: 38,
    paddingHorizontal: 4,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    textAlignVertical: "top",
  },
  sendButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 36,
    justifyContent: "center",
    marginBottom: 2,
    width: 36,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 16,
  },
});
