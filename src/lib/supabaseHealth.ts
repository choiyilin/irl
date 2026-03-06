import { supabase } from './supabase';

export async function supabaseHealthCheck(): Promise<string> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return `Error: ${error.message}`;
    return data.session
      ? `Supabase OK (session present)`
      : `Supabase OK (no session)`;
  } catch (e: any) {
    return `Error: ${e.message ?? String(e)}`;
  }
}
