import { createClient } from '@supabase/supabase-js';

// supabase-js wants the bare project URL (https://<ref>.supabase.co). The
// dashboard also shows endpoint URLs like https://<ref>.supabase.co/rest/v1/
// and its own page URL (https://supabase.com/dashboard/project/<ref>/...);
// pasting either makes every request fail with "Invalid path specified in
// request URL", so reduce whatever was configured to the project origin.
export function normalizeSupabaseUrl(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  let u;
  try { u = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`); } catch { return text.replace(/\/+$/, ''); }
  const fromDashboard = /(^|\.)supabase\.com$/i.test(u.hostname) && u.pathname.match(/\/project\/([a-z0-9]+)/i);
  if (fromDashboard) return `https://${fromDashboard[1]}.supabase.co`;
  if (/\.supabase\.(co|in)$/i.test(u.hostname)) return u.origin;
  // Self-hosted or custom domain: keep the path, minus any API suffix.
  return (u.origin + u.pathname).replace(/\/+$/, '').replace(/\/(rest|auth|storage|functions|realtime)\/v1$/i, '');
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseConfigured = Boolean(url && anonKey);

// Shown on the login screen to check which server and build are in use.
export const supabaseHost = (() => { try { return new URL(url).host; } catch { return url || '—'; } })();

export const supabase = supabaseConfigured
  ? createClient(url, anonKey)
  : null;
