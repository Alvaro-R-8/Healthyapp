import { supabase } from './supabaseClient.js';

const API_KEY_STORAGE = 'happ_api_key';

// In-memory cache populated by initStore() right after login. All getters
// below are synchronous reads from this cache; setters update the cache
// immediately (for snappy UI) and fire the Supabase write in the background.
const cache = {
  userId: null,
  plan: null,
  completed: {},
  comments: {},
  weight: { entries: [], goalWeight: null },
};

const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const newId = () => crypto.randomUUID();

// ── Sync errors ──────────────────────────────────────────────────────────────
// Background writes report failures here so the UI can show a toast. A failed
// write is retried once when the browser comes back online; writes share a key
// per record, so only the latest pending write for that record is retried.
const listeners = new Set();
const pending = new Map();

export function onSyncMessage(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const notify = (msg) => listeners.forEach(fn => fn(msg));

export const SAVE_FAILED_MSG = 'No se ha podido guardar en la nube. Se reintentará al recuperar la conexión.';

// Runs a write that resolves to Supabase's `{ error }` (or throws offline).
async function attempt(fn) {
  try {
    const res = await fn();
    return res?.error || null;
  } catch (err) {
    return err;
  }
}

function write(key, fn) {
  if (!cache.userId) return;
  attempt(fn).then(error => {
    if (!error) { pending.delete(key); return; }
    console.error(`[sync] ${key}:`, error);
    pending.set(key, fn);
    notify(SAVE_FAILED_MSG);
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    if (!pending.size) return;
    const retries = [...pending.entries()];
    pending.clear();
    let failed = 0;
    for (const [key, fn] of retries) {
      const error = await attempt(fn);
      if (error) { failed++; console.error(`[sync] retry ${key}:`, error); }
    }
    notify(failed ? 'Sigue sin poder guardarse en la nube. Revisa tu conexión.' : '✓ Cambios guardados en la nube');
  });
}

// Upserts `rows`, then — only if that worked — deletes the user's rows whose
// `keyCol` isn't in the new set, so a failure never leaves the cloud empty.
// Stale keys are looked up and deleted in chunks rather than sent as one huge
// `not in (...)` filter, which could exceed URL limits for long histories.
async function replaceRows(table, rows, keyCol, onConflict) {
  const uid = cache.userId;
  if (rows.length) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict });
    if (error) return { error };
  }
  const { data, error } = await supabase.from(table).select(keyCol).eq('user_id', uid);
  if (error) return { error };
  const keep = new Set(rows.map(r => String(r[keyCol])));
  const stale = (data || []).map(r => r[keyCol]).filter(k => !keep.has(String(k)));
  for (let i = 0; i < stale.length; i += 100) {
    const res = await supabase.from(table).delete().eq('user_id', uid).in(keyCol, stale.slice(i, i + 100));
    if (res.error) return res;
  }
  return { error: null };
}

// ── Init ─────────────────────────────────────────────────────────────────────
export async function initStore(userId) {
  cache.userId = userId;

  const [planRes, completedRes, commentsRes, weightRes, goalRes] = await Promise.all([
    supabase.from('plans').select('data').eq('user_id', userId).maybeSingle(),
    supabase.from('completed_sessions').select('session_id').eq('user_id', userId),
    supabase.from('session_comments').select('session_id, text').eq('user_id', userId),
    supabase.from('weight_entries').select('id, date, weight, type, note').eq('user_id', userId).order('date'),
    supabase.from('weight_goals').select('goal_weight').eq('user_id', userId).maybeSingle(),
  ]);

  const failed = [planRes, completedRes, commentsRes, weightRes, goalRes].filter(r => r.error);
  if (failed.length) {
    failed.forEach(r => console.error('[sync] load:', r.error));
    notify('No se han podido cargar todos tus datos de la nube. Revisa tu conexión y vuelve a abrir la app.');
  }

  cache.plan = planRes.data?.data || null;

  cache.completed = {};
  (completedRes.data || []).forEach(row => { cache.completed[row.session_id] = true; });

  cache.comments = {};
  (commentsRes.data || []).forEach(row => { cache.comments[row.session_id] = row.text; });

  cache.weight = {
    entries: (weightRes.data || []).map(e => ({ id: e.id, date: e.date, weight: Number(e.weight), type: e.type, note: e.note || '' })),
    goalWeight: goalRes.data?.goal_weight != null ? Number(goalRes.data.goal_weight) : null,
  };
}

export function isStoreReady() {
  return !!cache.userId;
}

// ── Plan ─────────────────────────────────────────────────────────────────────
export const getPlan = () => cache.plan;

const planRow = (plan) => ({
  user_id: cache.userId,
  name: plan?.name || null,
  description: plan?.description || null,
  start_date: plan?.startDate || null,
  data: plan,
  updated_at: new Date().toISOString(),
});

export function setPlan(plan) {
  cache.plan = plan;
  write('plan', () => supabase.from('plans').upsert(planRow(plan)));
}

export function clearPlan() {
  cache.plan = null;
  write('plan', () => supabase.from('plans').delete().eq('user_id', cache.userId));
}

// Loading a new plan starts from scratch: session ids like "w1-mon" are reused
// across plans, so old completions and comments would otherwise reappear.
// The old progress is only cleared once the new plan is saved.
export function replacePlan(plan) {
  cache.plan = plan;
  cache.completed = {};
  cache.comments = {};
  const uid = cache.userId;
  write('plan', async () => {
    const saved = await supabase.from('plans').upsert(planRow(plan));
    if (saved.error) return saved;
    const [completed, comments] = await Promise.all([
      supabase.from('completed_sessions').delete().eq('user_id', uid),
      supabase.from('session_comments').delete().eq('user_id', uid),
    ]);
    return { error: completed.error || comments.error };
  });
}

export function updateSessionInPlan(plan, sessionId, updates) {
  return {
    ...plan,
    weeks: plan.weeks.map(week => ({
      ...week,
      sessions: week.sessions.map(s =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    })),
  };
}

// ── Completed ────────────────────────────────────────────────────────────────
export const getCompleted = () => cache.completed;

export function toggleCompleted(sessionId) {
  const next = { ...cache.completed };
  const nowCompleted = !next[sessionId];
  if (nowCompleted) next[sessionId] = true;
  else delete next[sessionId];
  cache.completed = next;

  write(`completed:${sessionId}`, () => nowCompleted
    ? supabase.from('completed_sessions').upsert({ user_id: cache.userId, session_id: sessionId }, { onConflict: 'user_id,session_id' })
    : supabase.from('completed_sessions').delete().eq('user_id', cache.userId).eq('session_id', sessionId));
  return next;
}

// ── Comments ─────────────────────────────────────────────────────────────────
export const getComments = () => cache.comments;

export function setComment(sessionId, text) {
  const next = { ...cache.comments };
  const trimmed = text && text.trim();
  if (trimmed) next[sessionId] = trimmed;
  else delete next[sessionId];
  cache.comments = next;

  write(`comment:${sessionId}`, () => trimmed
    ? supabase.from('session_comments').upsert({ user_id: cache.userId, session_id: sessionId, text: trimmed, updated_at: new Date().toISOString() }, { onConflict: 'user_id,session_id' })
    : supabase.from('session_comments').delete().eq('user_id', cache.userId).eq('session_id', sessionId));
  return next;
}

// ── Weight ───────────────────────────────────────────────────────────────────
export const getWeight = () => cache.weight;

const weightRow = (e) => ({ id: e.id, user_id: cache.userId, date: e.date, weight: e.weight, type: e.type, note: e.note || null });

// Weight writes are keyed by day and type, so a newer save or delete for that
// slot supersedes an earlier failed one instead of both being retried.
const weightKey = (date, type) => `weight:${date}:${type}`;

export function addWeightEntry({ date, weight, type, note }) {
  const entries = cache.weight.entries.filter(e => !(e.date === date && e.type === type));
  const entry = { id: newId(), date, weight, type, note: (note || '').trim() };
  cache.weight = { ...cache.weight, entries: [...entries, entry] };

  // Insert first; any other entry for the same date and type is only removed
  // once the new one is safely stored.
  write(weightKey(date, type), async () => {
    const inserted = await supabase.from('weight_entries').upsert(weightRow(entry), { onConflict: 'id' });
    if (inserted.error) return inserted;
    return supabase.from('weight_entries').delete()
      .eq('user_id', cache.userId).eq('date', date).eq('type', type).neq('id', entry.id);
  });
  return cache.weight;
}

export function deleteWeightEntry(id) {
  const entry = cache.weight.entries.find(e => e.id === id);
  cache.weight = { ...cache.weight, entries: cache.weight.entries.filter(e => e.id !== id) };
  write(entry ? weightKey(entry.date, entry.type) : `weight:${id}`, () => supabase.from('weight_entries').delete().eq('id', id).eq('user_id', cache.userId));
  return cache.weight;
}

export function setGoalWeight(value) {
  cache.weight = { ...cache.weight, goalWeight: value };
  write('goal', () => value == null
    ? supabase.from('weight_goals').delete().eq('user_id', cache.userId)
    : supabase.from('weight_goals').upsert({ user_id: cache.userId, goal_weight: value }, { onConflict: 'user_id' }));
  return cache.weight;
}

export function replaceWeightEntries(rawEntries) {
  const entries = rawEntries.map(e => ({
    id: isUuid(e.id) ? e.id : newId(),
    date: e.date,
    weight: Number(e.weight),
    type: e.type === 'control' ? 'control' : 'official',
    note: (e.note || '').trim(),
  }));
  cache.weight = { ...cache.weight, entries };

  write('weight:all', () => replaceRows('weight_entries', entries.map(weightRow), 'id', 'id'));
  return cache.weight;
}

// ── API Key (kept local only — personal secret, not synced) ─────────────────
export const getApiKey = () => { try { return localStorage.getItem(API_KEY_STORAGE) || ''; } catch { return ''; } };
export const setApiKey = (key) => { try { localStorage.setItem(API_KEY_STORAGE, key); } catch {} };
export const clearApiKey = () => { try { localStorage.removeItem(API_KEY_STORAGE); } catch {} };

// ── Backup / Restore ─────────────────────────────────────────────────────────
export function exportAll() {
  return {
    plan: getPlan(),
    completed: getCompleted(),
    comments: getComments(),
    weight: getWeight(),
    exportedAt: new Date().toISOString(),
    version: 2,
  };
}

export function importAll(data) {
  if (data.plan !== undefined) setPlan(data.plan);
  if (data.completed !== undefined) {
    cache.completed = { ...data.completed };
    const ids = Object.keys(data.completed || {}).filter(k => data.completed[k]);
    write('completed:all', () => replaceRows(
      'completed_sessions',
      ids.map(session_id => ({ user_id: cache.userId, session_id })),
      'session_id',
      'user_id,session_id',
    ));
  }
  if (data.comments !== undefined) {
    cache.comments = { ...data.comments };
    const now = new Date().toISOString();
    write('comments:all', () => replaceRows(
      'session_comments',
      Object.entries(data.comments || {}).map(([session_id, text]) => ({ user_id: cache.userId, session_id, text, updated_at: now })),
      'session_id',
      'user_id,session_id',
    ));
  }
  if (data.weight !== undefined) {
    replaceWeightEntries(data.weight.entries || []);
    setGoalWeight(data.weight.goalWeight != null ? Number(data.weight.goalWeight) : null);
  }
}

export function clearAll() {
  cache.plan = null;
  cache.completed = {};
  cache.comments = {};
  cache.weight = { entries: [], goalWeight: null };

  const uid = cache.userId;
  write('clear-all', async () => {
    const results = await Promise.all([
      supabase.from('plans').delete().eq('user_id', uid),
      supabase.from('completed_sessions').delete().eq('user_id', uid),
      supabase.from('session_comments').delete().eq('user_id', uid),
      supabase.from('weight_entries').delete().eq('user_id', uid),
      supabase.from('weight_goals').delete().eq('user_id', uid),
    ]);
    return { error: results.find(r => r.error)?.error || null };
  });
}
