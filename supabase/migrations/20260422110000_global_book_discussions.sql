create table public.global_book_discussions (
  id uuid primary key default gen_random_uuid(),
  global_book_id uuid not null references public.global_books(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  title text,
  body text,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint global_book_discussions_active_content_check check (
    is_deleted = true or (
      coalesce(trim(title), '') <> '' and coalesce(trim(body), '') <> ''
    )
  )
);

create table public.discussion_comments (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.global_book_discussions(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  parent_comment_id uuid references public.discussion_comments(id) on delete cascade,
  reply_to_comment_id uuid references public.discussion_comments(id) on delete set null,
  reply_to_user_id uuid references public.profiles(id) on delete set null,
  body text,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discussion_comments_active_content_check check (
    is_deleted = true or coalesce(trim(body), '') <> ''
  )
);

create index global_book_discussions_global_book_id_created_at_idx
on public.global_book_discussions(global_book_id, created_at asc);

create index discussion_comments_discussion_id_created_at_idx
on public.discussion_comments(discussion_id, created_at asc);

create index discussion_comments_parent_comment_id_created_at_idx
on public.discussion_comments(parent_comment_id, created_at asc);

create index discussion_comments_reply_to_comment_id_idx
on public.discussion_comments(reply_to_comment_id);

create trigger global_book_discussions_set_updated_at
before update on public.global_book_discussions
for each row execute function public.set_updated_at();

create trigger discussion_comments_set_updated_at
before update on public.discussion_comments
for each row execute function public.set_updated_at();

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

  if parent_comment.parent_comment_id is not null then
    raise exception 'Parent comment must be top-level.';
  end if;

  if new.reply_to_comment_id is not null then
    select * into reply_target
    from public.discussion_comments
    where id = new.reply_to_comment_id;

    if not found then
      raise exception 'Reply target comment does not exist.';
    end if;

    if reply_target.discussion_id <> new.discussion_id then
      raise exception 'Reply target must belong to the same discussion.';
    end if;

    if reply_target.id <> new.parent_comment_id
      and reply_target.parent_comment_id <> new.parent_comment_id then
      raise exception 'Reply target must belong to the same top-level thread.';
    end if;
  end if;

  return new;
end;
$$;

create trigger discussion_comments_validate_threading
before insert or update on public.discussion_comments
for each row execute function public.validate_discussion_comment_threading();

create or replace function public.enforce_delete_only_discussion()
returns trigger
language plpgsql
as $$
begin
  if old.is_deleted then
    if new.title is distinct from old.title
      or new.body is distinct from old.body
      or new.deleted_at is distinct from old.deleted_at
      or new.is_deleted is distinct from old.is_deleted then
      raise exception 'Deleted discussions cannot be modified.';
    end if;
    return new;
  end if;

  if new.global_book_id is distinct from old.global_book_id
    or new.author_id is distinct from old.author_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Discussion ownership and identity cannot be changed.';
  end if;

  if new.is_deleted then
    new.title := null;
    new.body := null;
    new.deleted_at := coalesce(new.deleted_at, now());
    return new;
  end if;

  raise exception 'Discussions are delete-only.';
end;
$$;

create or replace function public.enforce_delete_only_comment()
returns trigger
language plpgsql
as $$
begin
  if old.is_deleted then
    if new.body is distinct from old.body
      or new.deleted_at is distinct from old.deleted_at
      or new.is_deleted is distinct from old.is_deleted then
      raise exception 'Deleted comments cannot be modified.';
    end if;
    return new;
  end if;

  if new.discussion_id is distinct from old.discussion_id
    or new.author_id is distinct from old.author_id
    or new.parent_comment_id is distinct from old.parent_comment_id
    or new.reply_to_comment_id is distinct from old.reply_to_comment_id
    or new.reply_to_user_id is distinct from old.reply_to_user_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Comment identity cannot be changed.';
  end if;

  if new.is_deleted then
    new.body := null;
    new.deleted_at := coalesce(new.deleted_at, now());
    return new;
  end if;

  raise exception 'Comments are delete-only.';
end;
$$;

create trigger global_book_discussions_delete_only
before update on public.global_book_discussions
for each row execute function public.enforce_delete_only_discussion();

create trigger discussion_comments_delete_only
before update on public.discussion_comments
for each row execute function public.enforce_delete_only_comment();

alter table public.global_book_discussions enable row level security;
alter table public.discussion_comments enable row level security;

create policy "Anyone can view global book discussions"
on public.global_book_discussions
for select
to anon, authenticated
using (true);

create policy "Anyone can view discussion comments"
on public.discussion_comments
for select
to anon, authenticated
using (true);

create policy "Authenticated users can create discussions"
on public.global_book_discussions
for insert
to authenticated
with check (author_id = auth.uid());

create policy "Authenticated users can create discussion comments"
on public.discussion_comments
for insert
to authenticated
with check (author_id = auth.uid());

create policy "Authors can delete only their own discussions"
on public.global_book_discussions
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "Authors can delete only their own comments"
on public.discussion_comments
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());
