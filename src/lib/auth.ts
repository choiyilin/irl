import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

// ── Apple Sign-In ───────────────────────────────────────────
export async function signInWithApple(): Promise<{ error?: string }> {
  try {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return { error: 'Apple Sign-In failed — no identity token.' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') return { error: 'Cancelled' };
    return { error: e.message ?? 'Apple Sign-In not available.' };
  }
}

// ── Google Sign-In (placeholder — needs OAuth config) ───────
export async function signInWithGoogle(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'irl-app://auth/callback',
        skipBrowserRedirect: true,
      },
    });
    if (error) return { error: error.message };
    return { error: 'Google Sign-In requires OAuth setup in Supabase dashboard. Configure the Google provider first.' };
  } catch (e: any) {
    return { error: e.message ?? 'Google Sign-In not available.' };
  }
}

// ── Phone OTP ───────────────────────────────────────────────
export async function sendPhoneOtp(phone: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message ?? 'Failed to send OTP.' };
  }
}

export async function verifyPhoneOtp(phone: string, code: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message ?? 'OTP verification failed.' };
  }
}

// ── Ensure profile row exists after auth ────────────────────
export async function ensureProfile(): Promise<{ status: 'active' | 'incomplete'; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: 'incomplete', error: 'No authenticated user.' };

    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('profile_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchErr) return { status: 'incomplete', error: fetchErr.message };

    if (profile) {
      return { status: profile.profile_status as 'active' | 'incomplete' };
    }

    const { error: insertErr } = await supabase
      .from('profiles')
      .insert({ user_id: user.id, profile_status: 'incomplete' });

    if (insertErr) return { status: 'incomplete', error: insertErr.message };
    return { status: 'incomplete' };
  } catch (e: any) {
    return { status: 'incomplete', error: e.message ?? 'Profile check failed.' };
  }
}

// ── Sign out ────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
