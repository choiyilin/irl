import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Types matching the DB schema ────────────────────────────
export interface SbProfile {
  user_id: string;
  first_name: string;
  age: number;
  gender: 'male' | 'female';
  interested_in: 'male' | 'female';
  hometown: string | null;
  city: string | null;
  neighborhood: string | null;
  job_title: string | null;
  company: string | null;
  school: string | null;
  height: string | null;
  religion: string | null;
  ethnicity: string | null;
  verified: boolean;
  is_premium: boolean;
  profile_status: string;
  photos: { slot_index: number; storage_path: string }[];
  prompts: { slot_index: number; question: string; answer: string }[];
}

export interface SbChatThread {
  id: string;
  chat_type: 'dm' | 'group';
  title: string | null;
  created_at: string;
  participants: { user_id: string; first_name: string; photo_url: string | null }[];
  last_message: string | null;
  last_message_at: string | null;
}

export interface SbMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  created_at: string;
  message_type: 'text' | 'referral_card' | 'system';
  text: string | null;
  referral_profile_id: string | null;
}

// ── Helpers ─────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

function photoUrl(storagePath: string): string {
  const { data } = supabase.storage.from('profile-photos').getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Match Feed ──────────────────────────────────────────────

export async function fetchMatchFeed(): Promise<{ data: SbProfile[]; error?: string }> {
  try {
    const userId = await getUserId();

    const { data: me, error: meErr } = await supabase
      .from('profiles')
      .select('interested_in')
      .eq('user_id', userId)
      .single();
    if (meErr || !me) return { data: [], error: meErr?.message ?? 'Profile not found' };

    const { data: liked } = await supabase
      .from('likes')
      .select('to_user')
      .eq('from_user', userId);
    const likedIds = (liked ?? []).map(l => l.to_user);

    const excludeIds = [userId, ...likedIds];

    let query = supabase
      .from('profiles')
      .select(`
        user_id, first_name, age, gender, interested_in,
        hometown, city, neighborhood, job_title, company, school,
        height, religion, ethnicity, verified, is_premium, profile_status
      `)
      .eq('profile_status', 'active')
      .eq('gender', me.interested_in)
      .not('user_id', 'in', `(${excludeIds.join(',')})`);

    const { data: profiles, error: profErr } = await query;
    if (profErr) return { data: [], error: profErr.message };

    const enriched: SbProfile[] = await Promise.all(
      (profiles ?? []).map(async (p: any) => {
        const { data: photos } = await supabase
          .from('profile_photos')
          .select('slot_index, storage_path')
          .eq('user_id', p.user_id)
          .order('slot_index');

        const { data: prompts } = await supabase
          .from('profile_prompts')
          .select('slot_index, answer, prompt_library(question)')
          .eq('user_id', p.user_id)
          .order('slot_index');

        return {
          ...p,
          photos: (photos ?? []).map((ph: any) => ({
            slot_index: ph.slot_index,
            storage_path: ph.storage_path,
          })),
          prompts: (prompts ?? []).map((pr: any) => ({
            slot_index: pr.slot_index,
            question: pr.prompt_library?.question ?? '',
            answer: pr.answer,
          })),
        };
      }),
    );

    return { data: enriched };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
}

const PLACEHOLDER_PHOTO = 'https://placehold.co/400x600/e2e8f0/94a3b8?text=No+Photo';

/** Pad photo URLs to exactly 6 entries; fill missing slots with placeholder */
function padPhotos(photos: { slot_index: number; storage_path: string }[]): string[] {
  const urls: string[] = new Array(6).fill(PLACEHOLDER_PHOTO);
  for (const ph of photos) {
    const idx = ph.slot_index - 1;
    if (idx >= 0 && idx < 6) {
      urls[idx] = photoUrl(ph.storage_path);
    }
  }
  return urls;
}

/** Pad prompts to exactly 3 entries */
function padPrompts(prompts: { slot_index: number; question: string; answer: string }[]): { question: string; answer: string }[] {
  const result: { question: string; answer: string }[] = [
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ];
  for (const pr of prompts) {
    const idx = pr.slot_index - 1;
    if (idx >= 0 && idx < 3) {
      result[idx] = { question: pr.question, answer: pr.answer };
    }
  }
  return result;
}

/** Convert SbProfile to the app's local Profile shape */
export function sbProfileToLocal(p: SbProfile): {
  id: string;
  name: string;
  age: number;
  photos: string[];
  prompts: { question: string; answer: string }[];
  hometown: string;
  job: string;
  company: string;
  school: string;
  neighborhood: string;
  height: string;
  religion: string;
  ethnicity: string;
  gender: 'male' | 'female';
  verified: boolean;
} {
  return {
    id: p.user_id,
    name: p.first_name ?? '',
    age: p.age ?? 0,
    photos: padPhotos(p.photos),
    prompts: padPrompts(p.prompts),
    hometown: p.hometown ?? '',
    job: p.job_title ?? '',
    company: p.company ?? '',
    school: p.school ?? '',
    neighborhood: p.neighborhood ?? '',
    height: p.height ?? '',
    religion: p.religion ?? '',
    ethnicity: p.ethnicity ?? '',
    gender: p.gender,
    verified: p.verified,
  };
}

// ── My Profile ──────────────────────────────────────────────

export async function fetchMyProfile(): Promise<{ data: SbProfile | null; error?: string }> {
  try {
    const userId = await getUserId();

    const { data: row, error: rowErr } = await supabase
      .from('profiles')
      .select(`
        user_id, first_name, age, gender, interested_in,
        hometown, city, neighborhood, job_title, company, school,
        height, religion, ethnicity, verified, is_premium, profile_status
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (rowErr) return { data: null, error: rowErr.message };
    if (!row) return { data: null, error: 'Profile row not found' };

    const { data: photos } = await supabase
      .from('profile_photos')
      .select('slot_index, storage_path')
      .eq('user_id', userId)
      .order('slot_index');

    const { data: prompts } = await supabase
      .from('profile_prompts')
      .select('slot_index, answer, prompt_library(question)')
      .eq('user_id', userId)
      .order('slot_index');

    const profile: SbProfile = {
      ...row,
      photos: (photos ?? []).map((ph: any) => ({
        slot_index: ph.slot_index,
        storage_path: ph.storage_path,
      })),
      prompts: (prompts ?? []).map((pr: any) => ({
        slot_index: pr.slot_index,
        question: pr.prompt_library?.question ?? '',
        answer: pr.answer,
      })),
    };

    return { data: profile };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function fetchStorageObjectsCount(): Promise<number> {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase.storage.from('profile-photos').list(userId);
    if (error || !data) return 0;
    return data.length;
  } catch {
    return 0;
  }
}

// ── Likes + Mutual matching ─────────────────────────────────

export async function sendLike(
  toUser: string,
  meta?: { targetType?: string; targetIndex?: number; promptQuestion?: string; comment?: string },
): Promise<{ matched: boolean; error?: string }> {
  try {
    const userId = await getUserId();

    const { error: likeErr } = await supabase.from('likes').insert({
      from_user: userId,
      to_user: toUser,
      target_type: meta?.targetType ?? null,
      target_index: meta?.targetIndex ?? null,
      prompt_question: meta?.promptQuestion ?? null,
      comment: meta?.comment ?? null,
    });
    if (likeErr) return { matched: false, error: likeErr.message };

    const { data: mutual } = await supabase
      .from('likes')
      .select('id')
      .eq('from_user', toUser)
      .eq('to_user', userId)
      .maybeSingle();

    if (!mutual) return { matched: false };

    const { error: matchErr } = await supabase.from('matches').insert({
      user_a: userId,
      user_b: toUser,
    });
    if (matchErr && !matchErr.message.includes('duplicate')) {
      return { matched: true, error: matchErr.message };
    }

    const chatId = await createMatchChat(userId, toUser, meta?.comment);

    return { matched: true };
  } catch (e: any) {
    return { matched: false, error: e.message };
  }
}

async function createMatchChat(
  userA: string,
  userB: string,
  note?: string,
): Promise<string> {
  const { data: chat } = await supabase
    .from('chats')
    .insert({ chat_type: 'dm' })
    .select('id')
    .single();

  const chatId = chat!.id;

  await supabase.from('chat_participants').insert([
    { chat_id: chatId, user_id: userA },
    { chat_id: chatId, user_id: userB },
  ]);

  await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: userA,
    message_type: 'system',
    text: note ? `You matched! Note: "${note}"` : 'You matched! Say hi.',
  });

  return chatId;
}

// ── Chats ───────────────────────────────────────────────────

export async function fetchMyChats(): Promise<{ data: SbChatThread[]; error?: string }> {
  try {
    const userId = await getUserId();

    const { data: memberships } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId);

    if (!memberships?.length) return { data: [] };
    const chatIds = memberships.map(m => m.chat_id);

    const { data: chats, error: chatsErr } = await supabase
      .from('chats')
      .select('id, chat_type, title, created_at')
      .in('id', chatIds)
      .order('created_at', { ascending: false });

    if (chatsErr) return { data: [], error: chatsErr.message };

    const threads: SbChatThread[] = await Promise.all(
      (chats ?? []).map(async (c: any) => {
        const { data: parts } = await supabase
          .from('chat_participants')
          .select('user_id, profiles(first_name)')
          .eq('chat_id', c.id);

        const participants = await Promise.all(
          (parts ?? []).map(async (pt: any) => {
            const { data: photo } = await supabase
              .from('profile_photos')
              .select('storage_path')
              .eq('user_id', pt.user_id)
              .eq('slot_index', 1)
              .maybeSingle();
            return {
              user_id: pt.user_id,
              first_name: pt.profiles?.first_name ?? '',
              photo_url: photo?.storage_path ? photoUrl(photo.storage_path) : null,
            };
          }),
        );

        const { data: lastMsg } = await supabase
          .from('messages')
          .select('text, created_at')
          .eq('chat_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          id: c.id,
          chat_type: c.chat_type,
          title: c.title,
          created_at: c.created_at,
          participants,
          last_message: lastMsg?.text ?? null,
          last_message_at: lastMsg?.created_at ?? c.created_at,
        };
      }),
    );

    return { data: threads };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
}

// ── Messages ────────────────────────────────────────────────

export async function fetchMessages(chatId: string): Promise<{ data: SbMessage[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [] };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
}

export async function sendMessage(
  chatId: string,
  text: string,
  type: 'text' | 'referral_card' | 'system' = 'text',
  referralProfileId?: string,
): Promise<{ error?: string }> {
  try {
    const userId = await getUserId();
    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: userId,
      message_type: type,
      text,
      referral_profile_id: referralProfileId ?? null,
    });
    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Premium toggle ──────────────────────────────────────────

export async function togglePremium(val: boolean): Promise<{ error?: string }> {
  try {
    const userId = await getUserId();
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: val })
      .eq('user_id', userId);
    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Likes Inbox ─────────────────────────────────────────────

export interface SbIncomingLike {
  id: string;
  from_user: string;
  first_name: string;
  age: number;
  photo_url: string | null;
  comment: string | null;
  created_at: string;
}

export async function fetchLikesReceived(): Promise<{ data: SbIncomingLike[]; error?: string }> {
  try {
    const userId = await getUserId();

    const { data: matchedUsers } = await supabase
      .from('matches')
      .select('user_a, user_b')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    const matchedIds = new Set(
      (matchedUsers ?? []).map((m: any) => (m.user_a === userId ? m.user_b : m.user_a)),
    );

    const { data: likes, error } = await supabase
      .from('likes')
      .select('id, from_user, comment, created_at')
      .eq('to_user', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };

    const unmatched = (likes ?? []).filter((l: any) => !matchedIds.has(l.from_user));

    const enriched: SbIncomingLike[] = await Promise.all(
      unmatched.map(async (l: any) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, age')
          .eq('user_id', l.from_user)
          .maybeSingle();

        const { data: photo } = await supabase
          .from('profile_photos')
          .select('storage_path')
          .eq('user_id', l.from_user)
          .eq('slot_index', 1)
          .maybeSingle();

        return {
          id: l.id,
          from_user: l.from_user,
          first_name: profile?.first_name ?? '',
          age: profile?.age ?? 0,
          photo_url: photo?.storage_path ? photoUrl(photo.storage_path) : null,
          comment: l.comment,
          created_at: l.created_at,
        };
      }),
    );

    return { data: enriched };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
}

// ── Message Requests (Supabase) ─────────────────────────────

export interface SbMessageRequest {
  id: string;
  from_user: string;
  to_user: string;
  venue_id: string | null;
  message: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined';
  from_name?: string;
  from_photo?: string | null;
  venue_name?: string;
}

export async function fetchIncomingRequests(): Promise<{ data: SbMessageRequest[]; error?: string }> {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('message_requests')
      .select('*')
      .eq('to_user', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };

    const enriched: SbMessageRequest[] = await Promise.all(
      (data ?? []).map(async (r: any) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', r.from_user)
          .maybeSingle();

        const { data: photo } = await supabase
          .from('profile_photos')
          .select('storage_path')
          .eq('user_id', r.from_user)
          .eq('slot_index', 1)
          .maybeSingle();

        let venueName: string | undefined;
        if (r.venue_id) {
          const { data: venue } = await supabase
            .from('venues')
            .select('name')
            .eq('id', r.venue_id)
            .maybeSingle();
          venueName = venue?.name;
        }

        return {
          ...r,
          from_name: profile?.first_name ?? '',
          from_photo: photo?.storage_path ? photoUrl(photo.storage_path) : null,
          venue_name: venueName,
        };
      }),
    );

    return { data: enriched };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
}

export async function createMessageRequest(
  toUser: string,
  message: string,
  venueId?: string,
): Promise<{ error?: string }> {
  try {
    const userId = await getUserId();
    const { error } = await supabase.from('message_requests').insert({
      from_user: userId,
      to_user: toUser,
      message,
      venue_id: venueId ?? null,
    });
    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateRequestStatus(
  requestId: string,
  status: 'accepted' | 'declined',
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('message_requests')
      .update({ status })
      .eq('id', requestId);
    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Realtime ────────────────────────────────────────────────

export function subscribeToChat(
  chatId: string,
  onMessage: (msg: SbMessage) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        onMessage(payload.new as SbMessage);
      },
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromChat(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
