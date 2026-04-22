import { supabase } from "@/src/lib/supabase";
import type {
  DiscussionComment,
  DiscussionCommentInsert,
  DiscussionCommentWithAuthor,
  GlobalBook,
  GlobalBookDiscussion,
  GlobalBookDiscussionPreview,
  GlobalBookDiscussionWithComments,
  Profile,
} from "@/src/types/database";

async function loadProfilesById(profileIds: string[]) {
  if (!profileIds.length) {
    return new Map<string, Profile>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", profileIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

function buildCommentWithAuthors(
  comment: DiscussionComment,
  profilesById: Map<string, Profile>,
): DiscussionCommentWithAuthor {
  return {
    ...comment,
    author: comment.author_id ? profilesById.get(comment.author_id) ?? null : null,
    reply_to_user: comment.reply_to_user_id
      ? profilesById.get(comment.reply_to_user_id) ?? null
      : null,
  };
}

function buildTopLevelComments(
  comments: DiscussionComment[],
  profilesById: Map<string, Profile>,
): GlobalBookDiscussionWithComments["top_level_comments"] {
  const topLevel = comments.filter((comment) => comment.parent_comment_id === null);
  const repliesByParentId = new Map<string, DiscussionCommentWithAuthor[]>();

  for (const reply of comments.filter((comment) => comment.parent_comment_id !== null)) {
    const parentId = reply.parent_comment_id!;
    if (reply.is_deleted) {
      continue;
    }
    const entry = repliesByParentId.get(parentId) ?? [];
    entry.push(buildCommentWithAuthors(reply, profilesById));
    repliesByParentId.set(parentId, entry);
  }

  return topLevel
    .filter((comment) => !comment.is_deleted || (repliesByParentId.get(comment.id)?.length ?? 0) > 0)
    .map((comment) => {
      const replies = repliesByParentId.get(comment.id) ?? [];
      return {
        ...buildCommentWithAuthors(comment, profilesById),
        replies,
        reply_count: replies.length,
      };
    });
}

function countVisibleComments(comments: DiscussionComment[]) {
  return comments.filter((comment) => !comment.is_deleted).length;
}

export async function loadGlobalBookDiscussions(globalBookId: string) {
  const { data: discussions, error } = await supabase
    .from("global_book_discussions")
    .select("*")
    .eq("global_book_id", globalBookId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  if (!discussions?.length) {
    return [] satisfies GlobalBookDiscussionPreview[];
  }

  const discussionIds = discussions.map((discussion) => discussion.id);
  const authorIds = Array.from(
    new Set(
      discussions
        .map((discussion) => discussion.author_id)
        .filter((authorId): authorId is string => Boolean(authorId)),
    ),
  );

  const [{ data: comments, error: commentsError }, profilesById] = await Promise.all([
    supabase
      .from("discussion_comments")
      .select("id, discussion_id, created_at, is_deleted")
      .in("discussion_id", discussionIds),
    loadProfilesById(authorIds),
  ]);

  if (commentsError) {
    throw commentsError;
  }

  const commentsByDiscussionId = new Map<
    string,
    { count: number; latestCommentAt: string | null }
  >();

  for (const comment of comments ?? []) {
    const current = commentsByDiscussionId.get(comment.discussion_id) ?? {
      count: 0,
      latestCommentAt: null,
    };
    if (!comment.is_deleted) {
      current.count += 1;
    }
    if (!current.latestCommentAt || current.latestCommentAt < comment.created_at) {
      current.latestCommentAt = comment.created_at;
    }
    commentsByDiscussionId.set(comment.discussion_id, current);
  }

  return discussions
    .filter((discussion) => !discussion.is_deleted || (commentsByDiscussionId.get(discussion.id)?.count ?? 0) > 0)
    .map((discussion) => {
      const counts = commentsByDiscussionId.get(discussion.id);
      return {
        ...discussion,
        author: discussion.author_id
          ? profilesById.get(discussion.author_id) ?? null
          : null,
        comment_count: counts?.count ?? 0,
        latest_comment_at: counts?.latestCommentAt ?? null,
      } satisfies GlobalBookDiscussionPreview;
    });
}

export async function loadGlobalBookDiscussion(discussionId: string) {
  const { data: discussion, error } = await supabase
    .from("global_book_discussions")
    .select("*")
    .eq("id", discussionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!discussion) {
    return null;
  }

  const [{ data: comments, error: commentsError }, globalBookResult] = await Promise.all([
    supabase
      .from("discussion_comments")
      .select("*")
      .eq("discussion_id", discussion.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("global_books")
      .select("*")
      .eq("id", discussion.global_book_id)
      .maybeSingle(),
  ]);

  if (commentsError) {
    throw commentsError;
  }

  if (globalBookResult.error) {
    throw globalBookResult.error;
  }

  const profileIds = Array.from(
    new Set(
      [
        discussion.author_id,
        ...(comments ?? []).flatMap((comment) => [
          comment.author_id,
          comment.reply_to_user_id,
        ]),
      ].filter((profileId): profileId is string => Boolean(profileId)),
    ),
  );

  const profilesById = await loadProfilesById(profileIds);
  const topLevelComments = buildTopLevelComments(comments ?? [], profilesById);

  return {
    ...discussion,
    author: discussion.author_id
      ? profilesById.get(discussion.author_id) ?? null
      : null,
    global_book: globalBookResult.data as GlobalBook | null,
    comment_count: countVisibleComments(comments ?? []),
    top_level_comments: topLevelComments,
  } satisfies GlobalBookDiscussionWithComments;
}

export async function createGlobalBookDiscussion(input: {
  global_book_id: string;
  author_id: string;
  title: string;
  body: string;
}) {
  const { data, error } = await supabase
    .from("global_book_discussions")
    .insert({
      global_book_id: input.global_book_id,
      author_id: input.author_id,
      title: input.title.trim(),
      body: input.body.trim(),
    })
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Discussion was created, but no row was returned.");
  }

  return data as GlobalBookDiscussion;
}

export async function createDiscussionComment(
  authorId: string,
  input: DiscussionCommentInsert,
) {
  const { data, error } = await supabase
    .from("discussion_comments")
    .insert({
      discussion_id: input.discussion_id,
      author_id: authorId,
      body: input.body.trim(),
      parent_comment_id: input.parent_comment_id ?? null,
      reply_to_comment_id: input.reply_to_comment_id ?? null,
      reply_to_user_id: input.reply_to_user_id ?? null,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Comment was created, but no row was returned.");
  }

  return data as DiscussionComment;
}

export async function softDeleteGlobalBookDiscussion(discussionId: string) {
  const { error } = await supabase
    .from("global_book_discussions")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", discussionId);

  if (error) {
    throw error;
  }
}

export async function softDeleteDiscussionComment(commentId: string) {
  const { error } = await supabase
    .from("discussion_comments")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", commentId);

  if (error) {
    throw error;
  }
}
