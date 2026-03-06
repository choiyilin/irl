-- ============================================================
-- IRL — Row Level Security Policies
-- Run AFTER schema.sql in the Supabase SQL Editor.
-- ============================================================

-- ── 1) profiles ─────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (user_id = auth.uid());

create policy "Users can read other active profiles"
  on public.profiles for select
  using (profile_status = 'active');

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (user_id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── 2) profile_photos ───────────────────────────────────────
alter table public.profile_photos enable row level security;

create policy "Users can manage their own photos"
  on public.profile_photos for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can view photos of active profiles"
  on public.profile_photos for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = profile_photos.user_id
        and p.profile_status = 'active'
    )
  );

-- ── 3) prompt_library ───────────────────────────────────────
alter table public.prompt_library enable row level security;

create policy "Prompts readable by all authenticated users"
  on public.prompt_library for select
  using (auth.role() = 'authenticated');

-- ── 4) profile_prompts ──────────────────────────────────────
alter table public.profile_prompts enable row level security;

create policy "Users can manage their own prompts"
  on public.profile_prompts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can view prompts of active profiles"
  on public.profile_prompts for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = profile_prompts.user_id
        and p.profile_status = 'active'
    )
  );

-- ── 5) likes ────────────────────────────────────────────────
alter table public.likes enable row level security;

create policy "Users can insert their own likes"
  on public.likes for insert
  with check (from_user = auth.uid());

create policy "Users can read their outgoing likes"
  on public.likes for select
  using (from_user = auth.uid());

create policy "Users can read their incoming likes"
  on public.likes for select
  using (to_user = auth.uid());

-- ── 6) matches ──────────────────────────────────────────────
alter table public.matches enable row level security;

create policy "Participants can read their matches"
  on public.matches for select
  using (user_a = auth.uid() or user_b = auth.uid());

create policy "System can insert matches"
  on public.matches for insert
  with check (user_a = auth.uid() or user_b = auth.uid());

-- ── 7) chats ────────────────────────────────────────────────
alter table public.chats enable row level security;

create policy "Participants can read their chats"
  on public.chats for select
  using (
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = chats.id
        and cp.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create chats"
  on public.chats for insert
  with check (auth.role() = 'authenticated');

-- ── 8) chat_participants ────────────────────────────────────
alter table public.chat_participants enable row level security;

create policy "Participants can read their chat memberships"
  on public.chat_participants for select
  using (
    exists (
      select 1 from public.chat_participants cp2
      where cp2.chat_id = chat_participants.chat_id
        and cp2.user_id = auth.uid()
    )
  );

create policy "Authenticated users can join chats"
  on public.chat_participants for insert
  with check (user_id = auth.uid());

-- ── 9) messages ─────────────────────────────────────────────
alter table public.messages enable row level security;

create policy "Participants can read messages in their chats"
  on public.messages for select
  using (
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = messages.chat_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Participants can send messages to their chats"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = messages.chat_id
        and cp.user_id = auth.uid()
    )
  );

-- ── 10) connections ─────────────────────────────────────────
alter table public.connections enable row level security;

create policy "Users can read their own connections"
  on public.connections for select
  using (user_id = auth.uid() or connection_user_id = auth.uid());

create policy "Users can insert their own connections"
  on public.connections for insert
  with check (user_id = auth.uid());

create policy "Users can delete their own connections"
  on public.connections for delete
  using (user_id = auth.uid());

-- ── 11) referrals ───────────────────────────────────────────
alter table public.referrals enable row level security;

create policy "Sender can insert referrals"
  on public.referrals for insert
  with check (from_user = auth.uid());

create policy "Sender can read their sent referrals"
  on public.referrals for select
  using (from_user = auth.uid());

create policy "Recipient can read their received referrals"
  on public.referrals for select
  using (to_user = auth.uid());

create policy "Recipient can update referral status"
  on public.referrals for update
  using (to_user = auth.uid())
  with check (to_user = auth.uid());

-- ── 12) venues ──────────────────────────────────────────────
alter table public.venues enable row level security;

create policy "Venues readable by all authenticated users"
  on public.venues for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can add venues"
  on public.venues for insert
  with check (auth.role() = 'authenticated');

create policy "Venue creators can update their venues"
  on public.venues for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ── 13) venue_ratings ───────────────────────────────────────
alter table public.venue_ratings enable row level security;

create policy "Ratings readable by all authenticated users"
  on public.venue_ratings for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own rating"
  on public.venue_ratings for insert
  with check (user_id = auth.uid());

create policy "Users can update their own rating"
  on public.venue_ratings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── 14) venue_checkins ──────────────────────────────────────
alter table public.venue_checkins enable row level security;

create policy "Users can insert their own checkins"
  on public.venue_checkins for insert
  with check (user_id = auth.uid());

create policy "Authenticated users can read recent checkins"
  on public.venue_checkins for select
  using (
    auth.role() = 'authenticated'
    and created_at > now() - interval '24 hours'
  );

-- ── 15) message_requests ────────────────────────────────────
alter table public.message_requests enable row level security;

create policy "Sender can insert message requests"
  on public.message_requests for insert
  with check (from_user = auth.uid());

create policy "Sender can read their sent requests"
  on public.message_requests for select
  using (from_user = auth.uid());

create policy "Receiver can read their incoming requests"
  on public.message_requests for select
  using (to_user = auth.uid());

create policy "Receiver can update request status"
  on public.message_requests for update
  using (to_user = auth.uid())
  with check (to_user = auth.uid());

-- ============================================================
-- Done! RLS enabled on all 15 tables with MVP-secure policies.
-- ============================================================
