create or replace function public.validate_discussion_comment_threading()
returns trigger
language plpgsql
as $$
declare
  parent_comment public.discussion_comments;
  reply_target public.discussion_comments;
begin
  if new.parent_comment_id is null then
    if new.reply_to_comment_id is not null or new.reply_to_user_id is not null then
      raise exception 'Top-level comments cannot target another comment.';
    end if;
    return new;
  end if;

  select * into parent_comment
  from public.discussion_comments
  where id = new.parent_comment_id;

  if not found then
    raise exception 'Parent comment does not exist.';
  end if;

  if parent_comment.discussion_id <> new.discussion_id then
    raise exception 'Parent comment must belong to the same discussion.';
  end if;

  if new.reply_to_comment_id is null then
    raise exception 'Replies must target a parent comment.';
  end if;

  select * into reply_target
  from public.discussion_comments
  where id = new.reply_to_comment_id;

  if not found then
    raise exception 'Reply target comment does not exist.';
  end if;

  if reply_target.discussion_id <> new.discussion_id then
    raise exception 'Reply target must belong to the same discussion.';
  end if;

  if reply_target.id <> new.parent_comment_id then
    raise exception 'Reply target must match the parent comment.';
  end if;

  return new;
end;
$$;
