import { createClient } from '@supabase/supabase-js';

// supabase-js wants the bare project URL. The dashboard also shows endpoint
// URLs like https://xxxx.supabase.co/rest/v1/, and pasting one of those makes
// every request fail with "Invalid path specified in request URL", so strip
// any trailing slash or API suffix.
export function normalizeSupabaseUrl(raw) {
  return String(raw || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/(rest|auth|storage|functions|realtime)\/v1$/i, '')
    .replace(/\/+$/, '');
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = supabaseConfigured
  ? createClient(url, anonKey)
  : null;
