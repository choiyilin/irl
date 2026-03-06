import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

// ── Types ───────────────────────────────────────────────────
export interface BasicsPayload {
  first_name: string;
  age: number;
  gender: 'male' | 'female';
  interested_in: 'male' | 'female';
  hometown?: string;
  neighborhood?: string;
  job_title?: string;
  company?: string;
  school?: string;
  height?: string;
  religion?: string;
  ethnicity?: string;
}

export interface PromptOption {
  id: string;
  question: string;
  category: string | null;
}

export interface PromptAnswer {
  slot_index: number;
  prompt_id: string;
  answer: string;
}

// ── Helpers ─────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

/** Step 1: Save basics to profiles (upsert — never a silent no-op) */
export async function saveBasics(payload: BasicsPayload): Promise<{ error?: string }> {
  try {
    const userId = await getUserId();
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { user_id: userId, ...payload, profile_status: 'incomplete' },
        { onConflict: 'user_id' },
      );
    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}

/** Step 2: Upload a single photo to Storage and write profile_photos row */
export async function uploadPhoto(
  slotIndex: number,
  localUri: string,
): Promise<{ error?: string }> {
  try {
    const userId = await getUserId();
    const path = `${userId}/${slotIndex}.png`;

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error: uploadErr } = await supabase.storage
      .from('profile-photos')
      .upload(path, decode(base64), { upsert: true, contentType: 'image/png' });

    if (uploadErr) return { error: uploadErr.message };

    const { error: rowErr } = await supabase
      .from('profile_photos')
      .upsert(
        { user_id: userId, slot_index: slotIndex, storage_path: path },
        { onConflict: 'user_id,slot_index' },
      );

    if (rowErr) return { error: rowErr.message };
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}

/** Step 3a: Fetch active prompts from prompt_library */
export async function fetchPrompts(): Promise<{ data: PromptOption[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('prompt_library')
      .select('id, question, category')
      .eq('active', true)
      .order('question');
    if (error) return { data: [], error: error.message };
    return { data: data ?? [] };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
}

/** Step 3b: Save 3 prompt answers */
export async function savePrompts(answers: PromptAnswer[]): Promise<{ error?: string }> {
  try {
    const userId = await getUserId();
    const rows = answers.map(a => ({
      user_id: userId,
      slot_index: a.slot_index,
      prompt_id: a.prompt_id,
      answer: a.answer,
    }));
    const { error } = await supabase
      .from('profile_prompts')
      .upsert(rows, { onConflict: 'user_id,slot_index' });
    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}

/** Check onboarding progress (photos + prompts counts) */
export async function checkOnboardingProgress(): Promise<{
  photos: number;
  prompts: number;
  ready: boolean;
  error?: string;
}> {
  try {
    const userId = await getUserId();

    const { count: photoCount, error: pErr } = await supabase
      .from('profile_photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: promptCount, error: prErr } = await supabase
      .from('profile_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (pErr || prErr) return { photos: 0, prompts: 0, ready: false, error: (pErr ?? prErr)!.message };

    const photos = photoCount ?? 0;
    const prompts = promptCount ?? 0;
    return { photos, prompts, ready: photos >= 6 && prompts >= 3 };
  } catch (e: any) {
    return { photos: 0, prompts: 0, ready: false, error: e.message };
  }
}

/** Step 4: Activate profile (only if 6 photos + 3 prompts exist) */
export async function activateProfile(): Promise<{ error?: string }> {
  try {
    const userId = await getUserId();

    const progress = await checkOnboardingProgress();
    if (progress.error) return { error: progress.error };
    if (!progress.ready) {
      return { error: `Profile incomplete: ${progress.photos}/6 photos, ${progress.prompts}/3 prompts` };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ profile_status: 'active' })
      .eq('user_id', userId);
    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}
