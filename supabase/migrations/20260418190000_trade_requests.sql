create type public.trade_request_status as enum (
  'pending',
  'accepted',
  'declined'
);

create table public.trade_requests (
  id uuid primary key default gen_random_uuid(),
  target_book_id uuid not null references public.books(id) on delete cascade,
  offered_book_id uuid not null references public.books(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status public.trade_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trade_requests_requester_id_idx on public.trade_requests(requester_id);
create index trade_requests_owner_id_idx on public.trade_requests(owner_id);
create index trade_requests_target_book_id_idx on public.trade_requests(target_book_id);
create index trade_requests_offered_book_id_idx on public.trade_requests(offered_book_id);

create unique index trade_requests_pending_unique_offer_idx
on public.trade_requests(requester_id, target_book_id, offered_book_id)
where status = 'pending';

create trigger trade_requests_set_updated_at
before update on public.trade_requests
for each row execute function public.set_updated_at();

alter table public.trade_requests enable row level security;

create policy "Trade participants can view requests"
on public.trade_requests
for select
to authenticated
using (requester_id = auth.uid() or owner_id = auth.uid());

create policy "Requesters can create own trade requests"
on public.trade_requests
for insert
to authenticated
with check (
  requester_id = auth.uid()
  and owner_id <> auth.uid()
  and status = 'pending'
  and exists (
    select 1
    from public.books target_book
    where target_book.id = target_book_id
      and target_book.owner_id = owner_id
      and target_book.is_published = true
  )
  and exists (
    select 1
    from public.books offered_book
    where offered_book.id = offered_book_id
      and offered_book.owner_id = auth.uid()
  )
);

create policy "Owners can update received request status"
on public.trade_requests
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Trade participants can view requested and offered books"
on public.books
for select
to authenticated
using (
  exists (
    select 1
    from public.trade_requests
    where (target_book_id = books.id or offered_book_id = books.id)
      and (requester_id = auth.uid() or owner_id = auth.uid())
  )
);
