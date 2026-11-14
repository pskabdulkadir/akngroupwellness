import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseServerClient(accessToken?: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error('SUPABASE_URL ve SUPABASE_PUBLISHABLE_KEY sunucu ortamında ayarlanmalıdır.');
  }

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}
