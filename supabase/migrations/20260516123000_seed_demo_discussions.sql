delete from public.discussion_comments;
delete from public.global_book_discussions;

insert into public.global_book_discussions (
  id,
  global_book_id,
  author_id,
  title,
  body
)
values
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '55555555-5555-5555-5555-555555555555',
    'Best starting point for Le Guin?',
    'I have only read Earthsea so far. Does this feel colder and more political, or still very character-driven?'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '66666666-6666-6666-6666-666666666666',
    'Would this work for a neighborhood book club?',
    'A few of us want to read Morrison together this month. Curious whether this one sparks good group discussion or if another novel is a better first pick.'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd3',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '77777777-7777-7777-7777-777777777777',
    'Mystery first or philosophy first?',
    'I love historical mysteries but I am not sure how dense Eco gets here. Hoping it still moves once the monastery setting is established.'
  ),
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
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '44444444-4444-4444-4444-444444444444',
    null,
    null,
    null,
    'It definitely feels more political, but the emotional thread is strong all the way through. The worldbuilding is patient rather than flashy.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '66666666-6666-6666-6666-666666666666',
    null,
    null,
    null,
    'I would start here if you want something that opens up into identity and diplomacy. It reads very differently from Earthsea in a good way.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '55555555-5555-5555-5555-555555555555',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    '44444444-4444-4444-4444-444444444444',
    'That is exactly what I was hoping for. Patient worldbuilding is usually my speed.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    '77777777-7777-7777-7777-777777777777',
    null,
    null,
    null,
    'I think it works for a club if everyone is okay sitting with heavy themes. The conversations after each section can be incredible.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    '44444444-4444-4444-4444-444444444444',
    null,
    null,
    null,
    'We read it in a small reading group and needed extra time, but nobody regretted it. There is a lot to unpack in a good way.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6',
    'dddddddd-dddd-dddd-dddd-ddddddddddd3',
    '55555555-5555-5555-5555-555555555555',
    null,
    null,
    null,
    'The mystery hook lands early. The philosophical stuff builds around it, so it never felt like homework to me.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7',
    'dddddddd-dddd-dddd-dddd-ddddddddddd3',
    '77777777-7777-7777-7777-777777777777',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6',
    '55555555-5555-5555-5555-555555555555',
    'Perfect, that balance is what I was trying to gauge before picking up a copy.'
  ),
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
