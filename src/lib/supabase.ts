import { createClient } from '@supabase/supabase-js';

/** Local Supabase CLI defaults — used in dev when .env vars are unset */
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const envUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const envKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

const supabaseUrl =
  envUrl ||
  (import.meta.env.DEV ? LOCAL_SUPABASE_URL : '');
const supabaseAnonKey =
  envKey ||
  (import.meta.env.DEV ? LOCAL_SUPABASE_ANON_KEY : '');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase URL or browser key. Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Same values passed to createClient — use where OAuth state must match the client */
export const resolvedSupabaseUrl = supabaseUrl;
export const resolvedSupabaseAnonKey = supabaseAnonKey;

export type User = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};
