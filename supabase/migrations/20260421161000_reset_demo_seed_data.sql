delete from public.trade_requests;
delete from public.books;
delete from public.global_books;
delete from public.profiles;
delete from auth.users where email like '%@booktrade.local';

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
values (
  '00000000-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444444',
  'authenticated',
  'authenticated',
  'demo.reader@booktrade.local',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Demo Reader"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into public.profiles (id, display_name, city, latitude, longitude)
values (
  '44444444-4444-4444-4444-444444444444',
  'Demo Reader',
  'Buenos Aires, AR',
  -34.603722,
  -58.381592
)
on conflict (id) do update
set
  display_name = excluded.display_name,
  city = excluded.city,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into public.global_books (
  id,
  title,
  author,
  editorial,
  description,
  cover_path,
  created_by
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'The Left Hand of Darkness',
    'Ursula K. Le Guin',
    'Ace Books',
    'A classic science fiction novel about politics, identity, and a frozen world.',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
    '44444444-4444-4444-4444-444444444444'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'Beloved',
    'Toni Morrison',
    'Vintage',
    'A haunting and intimate novel about memory, love, and survival after slavery.',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600',
    '44444444-4444-4444-4444-444444444444'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'The Name of the Rose',
    'Umberto Eco',
    'Picador',
    'A historical mystery set in an Italian monastery, blending semiotics and suspense.',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600',
    '44444444-4444-4444-4444-444444444444'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    'Parable of the Sower',
    'Octavia E. Butler',
    'Grand Central Publishing',
    'A visionary dystopian novel following a young woman through social collapse.',
    'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=600',
    '44444444-4444-4444-4444-444444444444'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5',
    'If on a winter''s night a traveler',
    'Italo Calvino',
    'Mariner Books',
    'A playful, fragmented novel about reading, authorship, and unfinished stories.',
    'https://images.unsplash.com/photo-1621351123083-b88ecd2d5708?w=600',
    '44444444-4444-4444-4444-444444444444'
  )
on conflict (id) do update
set
  title = excluded.title,
  author = excluded.author,
  editorial = excluded.editorial,
  description = excluded.description,
  cover_path = excluded.cover_path,
  created_by = excluded.created_by,
  updated_at = now();

insert into public.books (
  id,
  owner_id,
  title,
  author,
  description,
  condition,
  cover_path,
  global_book_id,
  is_published
)
values
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '44444444-4444-4444-4444-444444444444',
    'The Left Hand of Darkness',
    'Ursula K. Le Guin',
    'Trade paperback with a few pencil notes and a clean spine.',
    'good',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    '44444444-4444-4444-4444-444444444444',
    'Beloved',
    'Toni Morrison',
    'Paperback edition with lightly worn corners.',
    'good',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    '44444444-4444-4444-4444-444444444444',
    'The Name of the Rose',
    'Umberto Eco',
    'Hardcover with dust jacket in excellent shape.',
    'like_new',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc4',
    '44444444-4444-4444-4444-444444444444',
    'Parable of the Sower',
    'Octavia E. Butler',
    'Private shelf copy kept for a future trade.',
    'like_new',
    'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=600',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    false
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc5',
    '44444444-4444-4444-4444-444444444444',
    'Collected Stories',
    'Clarice Lispector',
    'Unlinked copy used to test the optional global book workflow.',
    'fair',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600',
    null,
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc6',
    '44444444-4444-4444-4444-444444444444',
    'Reading Journal',
    'Demo Reader',
    'A private unlinked record for exercising edit and publish states.',
    'new',
    null,
    null,
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
  global_book_id = excluded.global_book_id,
  is_published = excluded.is_published,
  updated_at = now();
