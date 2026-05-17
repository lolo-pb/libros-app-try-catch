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
  '88888888-8888-8888-8888-888888888888',
  'authenticated',
  'authenticated',
  'carla.stack@booktrade.local',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Carla Mendez"}'::jsonb,
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000000',
  '99999999-9999-9999-9999-999999999999',
  'authenticated',
  'authenticated',
  'tomas.margin@booktrade.local',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Tomas Aguilar"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into public.profiles (id, display_name, city, latitude, longitude)
values
(
  '88888888-8888-8888-8888-888888888888',
  'Carla Mendez',
  'Buenos Aires, AR',
  -34.606205,
  -58.417873
),
(
  '99999999-9999-9999-9999-999999999999',
  'Tomas Aguilar',
  'Buenos Aires, AR',
  -34.582194,
  -58.438902
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
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6',
    'Kindred',
    'Octavia E. Butler',
    'Beacon Press',
    'A tense and intimate novel that folds time travel into memory, family, and survival.',
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600',
    '88888888-8888-8888-8888-888888888888'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7',
    'Piranesi',
    'Susanna Clarke',
    'Bloomsbury Publishing',
    'A dreamy, strange novel about a labyrinthine house, tides, statues, and shifting memory.',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600',
    '99999999-9999-9999-9999-999999999999'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8',
    'The Dispossessed',
    'Ursula K. Le Guin',
    'Harper Perennial',
    'An ambitious science fiction novel about political systems, belonging, and the cost of ideals.',
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600',
    '55555555-5555-5555-5555-555555555555'
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
    'cccccccc-cccc-cccc-cccc-ccccccccccc7',
    '88888888-8888-8888-8888-888888888888',
    'Kindred',
    'Octavia E. Butler',
    'Copy with a cracked spine and very clean pages. Easy recommendation for someone discovering Butler.',
    'good',
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6',
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc8',
    '99999999-9999-9999-9999-999999999999',
    'Piranesi',
    'Susanna Clarke',
    'Trade paperback with one highlighted passage near the end and a nearly new cover.',
    'like_new',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7',
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc9',
    '55555555-5555-5555-5555-555555555555',
    'The Dispossessed',
    'Ursula K. Le Guin',
    'Softcover with margin notes in the first section, otherwise very readable and sturdy.',
    'fair',
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8',
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccc10',
    '66666666-6666-6666-6666-666666666666',
    'Labyrinths',
    'Jorge Luis Borges',
    'Pocket edition with a name written inside the cover. Great test case for linked-vs-unlinked shelves.',
    'good',
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600',
    null,
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccc11',
    '77777777-7777-7777-7777-777777777777',
    'Parable of the Sower',
    'Octavia E. Butler',
    'Second copy marked up for a reading circle, posted separately from my private shelf copy.',
    'good',
    'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=600',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccc12',
    '99999999-9999-9999-9999-999999999999',
    'The Left Hand of Darkness',
    'Ursula K. Le Guin',
    'Older edition with some page tanning, still solid and ready for a swap.',
    'fair',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    true
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

insert into public.global_book_discussions (
  id,
  global_book_id,
  author_id,
  title,
  body
)
values
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd4',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6',
    '88888888-8888-8888-8888-888888888888',
    'Best way to introduce Butler to a friend?',
    'I have a friend who likes literary fiction more than sci-fi. Wondering whether Kindred is the best first pick or if Parable is a stronger hook.'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7',
    '99999999-9999-9999-9999-999999999999',
    'Did Piranesi click for you right away?',
    'The atmosphere has me already, but I am curious whether the mystery takes shape quickly or if the payoff is more gradual.'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd6',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8',
    '55555555-5555-5555-5555-555555555555',
    'Favorite companion read for The Dispossessed?',
    'I want to pair this with something shorter for a tiny reading group. Thinking essay, novella, or another Le Guin with a different energy.'
  )
on conflict (id) do update
set
  global_book_id = excluded.global_book_id,
  author_id = excluded.author_id,
  title = excluded.title,
  body = excluded.body,
  is_deleted = false,
  deleted_at = null,
  updated_at = now();

insert into public.discussion_comments (
  id,
  discussion_id,
  author_id,
  parent_comment_id,
  reply_to_comment_id,
  reply_to_user_id,
  body
)
values
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee8',
    'dddddddd-dddd-dddd-dddd-ddddddddddd4',
    '44444444-4444-4444-4444-444444444444',
    null,
    null,
    null,
    'Kindred is the one I hand to almost everyone first. It has the urgency of a page-turner even for people who do not usually read speculative fiction.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee9',
    'dddddddd-dddd-dddd-dddd-ddddddddddd4',
    '77777777-7777-7777-7777-777777777777',
    null,
    null,
    null,
    'Parable might hit harder if they already like dystopian stories, but Kindred is the safer recommendation for literary readers.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee10',
    'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    '66666666-6666-6666-6666-666666666666',
    null,
    null,
    null,
    'It clicked for me slowly. The voice and setting do most of the work early, then the shape of the mystery starts tightening a bit later.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee11',
    'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    '99999999-9999-9999-9999-999999999999',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee10',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee10',
    '66666666-6666-6666-6666-666666666666',
    'That sounds good to me, honestly. I am happy to stay in the atmosphere if the payoff is there.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee12',
    'dddddddd-dddd-dddd-dddd-ddddddddddd6',
    '88888888-8888-8888-8888-888888888888',
    null,
    null,
    null,
    'I paired it with Le Guin essays the first time, but for a lighter second text I would probably choose a novella with a sharper personal focus.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee13',
    'dddddddd-dddd-dddd-dddd-ddddddddddd6',
    '44444444-4444-4444-4444-444444444444',
    null,
    null,
    null,
    'You could also pair it with The Ones Who Walk Away from Omelas for a shorter ethics conversation, even if the tone is different.'
  )
on conflict (id) do update
set
  discussion_id = excluded.discussion_id,
  author_id = excluded.author_id,
  parent_comment_id = excluded.parent_comment_id,
  reply_to_comment_id = excluded.reply_to_comment_id,
  reply_to_user_id = excluded.reply_to_user_id,
  body = excluded.body,
  is_deleted = false,
  deleted_at = null,
  updated_at = now();
