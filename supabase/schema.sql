-- ============================================================
-- IRL — Supabase Postgres Schema
-- Paste this entire script into the Supabase SQL Editor and run.
-- ============================================================

-- ── Helper: updated_at trigger function ─────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- A) CORE TABLES
-- ============================================================

-- 1) profiles
create table public.profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  first_name    text,
  age           int,
  gender        text check (gender in ('male', 'female')),
  interested_in text check (interested_in in ('male', 'female')),
  hometown      text,
  city          text default 'New York City',
  neighborhood  text,
  job_title     text,
  company       text,
  school        text,
  height        text,
  religion      text,
  ethnicity     text,
  bio           text,
  verified      boolean not null default false,
  is_premium    boolean not null default false,
  profile_status text not null default 'incomplete'
    check (profile_status in ('incomplete', 'active'))
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 2) profile_photos
create table public.profile_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  slot_index   int not null check (slot_index between 1 and 6),
  storage_path text not null,
  created_at   timestamptz not null default now(),
  unique (user_id, slot_index)
);

create index idx_profile_photos_user on public.profile_photos(user_id);

-- 3) prompt_library
create table public.prompt_library (
  id       uuid primary key default gen_random_uuid(),
  question text not null,
  category text,
  active   boolean not null default true
);

-- 4) profile_prompts
create table public.profile_prompts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  slot_index int not null check (slot_index between 1 and 3),
  prompt_id  uuid not null references public.prompt_library(id),
  answer     text not null,
  unique (user_id, slot_index)
);

create index idx_profile_prompts_user on public.profile_prompts(user_id);

-- ============================================================
-- B) SOCIAL GRAPH / MATCHING
-- ============================================================

-- 5) likes
create table public.likes (
  id              uuid primary key default gen_random_uuid(),
  from_user       uuid not null references public.profiles(user_id),
  to_user         uuid not null references public.profiles(user_id),
  created_at      timestamptz not null default now(),
  target_type     text check (target_type in ('photo', 'prompt', 'info')),
  target_index    int,
  prompt_question text,
  comment         text,
  unique (from_user, to_user)
);

create index idx_likes_to_user on public.likes(to_user, created_at desc);
create index idx_likes_from_user on public.likes(from_user, created_at desc);

-- 6) matches
create table public.matches (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references public.profiles(user_id),
  user_b     uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now()
);

-- Unique constraint on the canonical pair so (A,B) and (B,A) collapse
create unique index idx_matches_pair
  on public.matches (least(user_a, user_b), greatest(user_a, user_b));

create index idx_matches_user_a on public.matches(user_a);
create index idx_matches_user_b on public.matches(user_b);

-- 7) chats
create table public.chats (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  chat_type  text not null default 'dm' check (chat_type in ('dm', 'group')),
  title      text
);

-- 8) chat_participants
create table public.chat_participants (
  chat_id   uuid not null references public.chats(id) on delete cascade,
  user_id   uuid not null references public.profiles(user_id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create index idx_chat_participants_user on public.chat_participants(user_id);

-- 9) messages
create table public.messages (
  id                  uuid primary key default gen_random_uuid(),
  chat_id             uuid not null references public.chats(id) on delete cascade,
  sender_id           uuid not null references public.profiles(user_id),
  created_at          timestamptz not null default now(),
  message_type        text not null default 'text'
    check (message_type in ('text', 'referral_card', 'system')),
  text                text,
  referral_profile_id uuid references public.profiles(user_id)
);

create index idx_messages_chat on public.messages(chat_id, created_at);
create index idx_messages_sender on public.messages(sender_id);

-- ============================================================
-- C) CONNECTIONS + REFERRALS
-- ============================================================

-- 10) connections
create table public.connections (
  user_id            uuid not null references public.profiles(user_id) on delete cascade,
  connection_user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at         timestamptz not null default now(),
  primary key (user_id, connection_user_id)
);

-- 11) referrals
create table public.referrals (
  id                  uuid primary key default gen_random_uuid(),
  from_user           uuid not null references public.profiles(user_id),
  to_user             uuid not null references public.profiles(user_id),
  referred_profile_id uuid not null references public.profiles(user_id),
  created_at          timestamptz not null default now(),
  status              text not null default 'sent'
    check (status in ('sent', 'accepted', 'declined'))
);

create index idx_referrals_to on public.referrals(to_user, created_at desc);

-- ============================================================
-- D) VENUES + RATINGS + CHECKINS
-- ============================================================

-- 12) venues
create table public.venues (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text,
  neighborhood text,
  lat          double precision,
  lng          double precision,
  tags         text[] not null default '{}',
  rating_avg   numeric not null default 0,
  partner      boolean not null default false,
  featured     boolean not null default false,
  deal_title   text,
  deal_details text,
  created_at   timestamptz not null default now(),
  created_by   uuid references public.profiles(user_id)
);

create index idx_venues_category on public.venues(category);
create index idx_venues_featured on public.venues(featured) where featured = true;

-- 13) venue_ratings
create table public.venue_ratings (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references public.venues(id) on delete cascade,
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (venue_id, user_id)
);

-- 14) venue_checkins
create table public.venue_checkins (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references public.venues(id) on delete cascade,
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_checkins_venue on public.venue_checkins(venue_id, created_at desc);
create index idx_checkins_user on public.venue_checkins(user_id, created_at desc);

-- ============================================================
-- E) MESSAGE REQUESTS (MISSED CONNECTIONS)
-- ============================================================

-- 15) message_requests
create table public.message_requests (
  id         uuid primary key default gen_random_uuid(),
  from_user  uuid not null references public.profiles(user_id),
  to_user    uuid not null references public.profiles(user_id),
  venue_id   uuid references public.venues(id),
  message    text not null,
  created_at timestamptz not null default now(),
  status     text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined'))
);

create index idx_message_requests_to on public.message_requests(to_user, status);

-- ============================================================
-- F) PROMPT LIBRARY SEED (~40 prompts)
-- ============================================================

insert into public.prompt_library (question, category) values
  -- Getting to know you
  ('A life goal of mine', 'goals'),
  ('I''m looking for', 'intentions'),
  ('The way to win me over is', 'dating'),
  ('My most irrational fear', 'personality'),
  ('I''m convinced that', 'personality'),
  ('My simple pleasures', 'lifestyle'),
  ('Something I''d love to do together', 'dating'),
  ('My go-to karaoke song', 'fun'),
  ('The key to my heart is', 'dating'),
  ('I get way too excited about', 'personality'),

  -- Fun / lighthearted
  ('Two truths and a lie', 'fun'),
  ('My most controversial opinion', 'fun'),
  ('The last thing I Googled', 'fun'),
  ('My hidden talent', 'fun'),
  ('I will absolutely judge you if', 'fun'),
  ('A random fact I love', 'fun'),
  ('Worst take I''ll defend to the death', 'fun'),
  ('The hallmark of a good relationship is', 'dating'),

  -- Lifestyle
  ('A perfect Sunday looks like', 'lifestyle'),
  ('My ideal first date', 'dating'),
  ('I geek out on', 'lifestyle'),
  ('My comfort meal is', 'lifestyle'),
  ('I''m weirdly good at', 'lifestyle'),
  ('You should leave a comment if', 'dating'),
  ('After work you can find me', 'lifestyle'),
  ('My love language is', 'dating'),

  -- NYC-specific
  ('The best spot in NYC is', 'nyc'),
  ('My favorite neighborhood in the city', 'nyc'),
  ('My unpopular NYC opinion', 'nyc'),
  ('Best cheap eats in Manhattan', 'nyc'),
  ('I moved to NYC because', 'nyc'),
  ('A hidden gem I always take people to', 'nyc'),

  -- Deeper
  ('I''m most grateful for', 'deep'),
  ('The most spontaneous thing I''ve done', 'deep'),
  ('A boundary of mine', 'deep'),
  ('I feel most confident when', 'deep'),
  ('Change my mind about', 'deep'),
  ('Together we could', 'dating'),
  ('This year I want to', 'goals'),
  ('Biggest risk I''ve taken', 'deep'),
  ('If I could live anywhere for a year', 'deep'),
  ('What I value most in a person', 'deep');

-- ============================================================
-- Done! All tables, indexes, triggers, and seed data created.
-- ============================================================
