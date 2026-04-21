create table public.global_books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  editorial text,
  description text,
  cover_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.books
add column global_book_id uuid references public.global_books(id) on delete set null;

create index books_global_book_id_idx on public.books(global_book_id);
create index global_books_created_at_idx on public.global_books(created_at desc);

create trigger global_books_set_updated_at
before update on public.global_books
for each row execute function public.set_updated_at();

alter table public.global_books enable row level security;

create policy "Anyone can view global books"
on public.global_books
for select
to anon, authenticated
using (true);

create policy "Authenticated users can create global books"
on public.global_books
for insert
to authenticated
with check (created_by = auth.uid());
