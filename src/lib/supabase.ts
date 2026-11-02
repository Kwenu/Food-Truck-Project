import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** False until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set (see README). */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * One shared client for the whole app. It only ever uses the public "anon" key —
 * what each visitor can read or change is decided by the Row Level Security
 * rules in supabase/schema.sql, not by this key.
 */
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'not-configured', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});
