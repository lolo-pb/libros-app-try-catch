drop policy if exists "Users can view published books and own books" on public.books;

create policy "Anyone can view published books"
on public.books
for select
to anon, authenticated
using (is_published);

create policy "Users can view own books"
on public.books
for select
to authenticated
using (owner_id = auth.uid());

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'lucia.mock@booktrade.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Lucia Martinez"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'mateo.mock@booktrade.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Mateo Alvarez"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'sofia.mock@booktrade.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Sofia Vega"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.profiles (id, display_name, city, latitude, longitude)
values
  ('11111111-1111-1111-1111-111111111111', 'Lucia Martinez', 'Buenos Aires, AR', -34.603722, -58.381592),
  ('22222222-2222-2222-2222-222222222222', 'Mateo Alvarez', 'Buenos Aires, AR', -34.589546, -58.397364),
  ('33333333-3333-3333-3333-333333333333', 'Sofia Vega', 'Buenos Aires, AR', -34.615803, -58.433298)
on conflict (id) do update
set
  display_name = excluded.display_name,
  city = excluded.city,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into public.books (
  id,
  owner_id,
  title,
  author,
  description,
  condition,
  cover_path,
  is_published
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    'The Great Gatsby',
    'F. Scott Fitzgerald',
    'A clean paperback copy with light notes on the first chapter.',
    'good',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600',
    true
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '22222222-2222-2222-2222-222222222222',
    '1984',
    'George Orwell',
    'Pocket edition, slightly worn corners, pages in great shape.',
    'fair',
    'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=600',
    true
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '33333333-3333-3333-3333-333333333333',
    'The Hobbit',
    'J.R.R. Tolkien',
    'Hardcover copy, excellent condition, open to fantasy swaps.',
    'like_new',
    'https://images.unsplash.com/photo-1621351123083-b88ecd2d5708?w=600',
    true
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    '11111111-1111-1111-1111-111111111111',
    'Ulysses',
    'James Joyce',
    'Well-loved copy from a literature class, readable and complete.',
    'fair',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600',
    true
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
    '22222222-2222-2222-2222-222222222222',
    'The Pragmatic Programmer',
    'David Thomas and Andrew Hunt',
    'Second edition. Great for someone starting a software shelf.',
    'good',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600',
    true
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
    '33333333-3333-3333-3333-333333333333',
    'Invisible Cities',
    'Italo Calvino',
    'Small paperback, beautiful condition, no markings.',
    'like_new',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
    false
  )
on conflict (id) do update
set
  owner_id = excluded.owner_id,
  title = excluded.title,
  author = excluded.author,
  description = excluded.description,
  condition = excluded.condition,
  cover_path = excluded.cover_path,
  is_published = excluded.is_published;
