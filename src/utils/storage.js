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

  // A failed read must not look like "no data": report it to the caller,
  // which blocks the app with a retry screen instead of showing it empty.
  const failed = [planRes, completedRes, commentsRes, weightRes, goalRes].filter(r => r.error);
  if (failed.length) {
    failed.forEach(r => console.error('[sync] load:', r.error));
    return { error: failed[0].error };
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
  return { error: null };
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

// ── Plan history ─────────────────────────────────────────────────────────────
// Plans are archived (with their progress and notes) before being replaced or
// ended, so nothing is lost and they can be reused later.

// The plan_history table comes from a migration the owner runs by hand; until
// then archiving is skipped with a warning instead of blocking imports.
const isMissingTable = (error) => ['PGRST205', '42P01'].includes(error?.code) || /plan_history/.test(error?.message || '');
const MISSING_HISTORY_MSG = 'Falta crear la tabla de planes guardados en Supabase (supabase/migrations). El plan anterior no se ha archivado.';

const planDates = (plan) => (plan?.weeks || []).flatMap(w => w.sessions || []).map(s => s.date).filter(Boolean).sort();

function historyRow(plan, completed, comments) {
  const sessions = (plan.weeks || []).flatMap(w => w.sessions || []).filter(s => s.type !== 'rest');
  const ids = new Set(sessions.map(s => s.id));
  const pick = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => ids.has(k)));
  const dates = planDates(plan);
  const done = pick(completed);
  return {
    id: newId(),
    user_id: cache.userId,
    name: plan.name || null,
    start_date: dates[0] || plan.startDate || null,
    end_date: dates[dates.length - 1] || null,
    weeks: plan.weeks?.length || 0,
    total_sessions: sessions.length,
    done_sessions: Object.keys(done).length,
    data: plan,
    completed: done,
    comments: pick(comments),
  };
}

// Returns { error, skipped }: a missing table is reported once and skipped.
async function archive(row) {
  const res = await supabase.from('plan_history').upsert(row, { onConflict: 'id' });
  if (res.error && isMissingTable(res.error)) {
    console.warn('[sync] plan_history missing:', res.error);
    notify(MISSING_HISTORY_MSG);
    return { error: null, skipped: true };
  }
  return { error: res.error || null };
}

async function clearProgress(uid) {
  const [completed, comments] = await Promise.all([
    supabase.from('completed_sessions').delete().eq('user_id', uid),
    supabase.from('session_comments').delete().eq('user_id', uid),
  ]);
  return { error: completed.error || comments.error };
}

// Loading a new plan starts from scratch: session ids like "w1-mon" are reused
// across plans, so old completions and comments would otherwise reappear.
// The current plan is archived first; old progress is only cleared once both
// the archive and the new plan are saved.
export function replacePlan(plan) {
  const previous = cache.plan ? historyRow(cache.plan, cache.completed, cache.comments) : null;
  cache.plan = plan;
  cache.completed = {};
  cache.comments = {};
  const uid = cache.userId;
  write('plan', async () => {
    if (previous) {
      const archived = await archive(previous);
      if (archived.error) return archived;
    }
    const saved = await supabase.from('plans').upsert(planRow(plan));
    if (saved.error) return saved;
    return clearProgress(uid);
  });
}

// "Terminar plan": archive it and leave no active plan. Waits for the archive
// before touching anything, so if it fails (offline, or the plan_history table
// hasn't been created yet) the plan stays active both here and in the cloud.
// Resolves to { error, missingTable }.
export async function endCurrentPlan() {
  if (!cache.plan || !cache.userId) return { error: null };
  const row = historyRow(cache.plan, cache.completed, cache.comments);
  const res = await attempt(() => supabase.from('plan_history').upsert(row, { onConflict: 'id' }));
  if (res) {
    console.error('[sync] end plan:', res);
    return { error: res, missingTable: isMissingTable(res) };
  }
  cache.plan = null;
  cache.completed = {};
  cache.comments = {};
  const uid = cache.userId;
  write('plan', async () => {
    const removed = await supabase.from('plans').delete().eq('user_id', uid);
    if (removed.error) return removed;
    return clearProgress(uid);
  });
  return { error: null };
}

export async function listPlanHistory() {
  if (!cache.userId) return { data: [], error: null };
  const res = await supabase.from('plan_history')
    .select('id, name, start_date, end_date, weeks, total_sessions, done_sessions, archived_at')
    .eq('user_id', cache.userId)
    .order('archived_at', { ascending: false });
  if (res.error) console.error('[sync] history list:', res.error);
  return { data: res.data || [], error: res.error || null, missingTable: isMissingTable(res.error) };
}

export async function getPlanHistoryItem(id) {
  const res = await supabase.from('plan_history')
    .select('id, name, data, completed, comments, start_date, end_date')
    .eq('user_id', cache.userId).eq('id', id).maybeSingle();
  if (res.error) console.error('[sync] history item:', res.error);
  return { data: res.data || null, error: res.error || null };
}

export function deletePlanHistory(id) {
  write(`history:${id}`, () => supabase.from('plan_history').delete().eq('user_id', cache.userId).eq('id', id));
}

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// First day on or after `fromDate` with the same weekday as the plan's first
// session, so Mondays stay Mondays when a plan is reused.
export function alignedStart(plan, fromDate) {
  const first = planDates(plan)[0];
  if (!first || !fromDate) return fromDate;
  const want = new Date(first + 'T12:00:00').getDay();
  const have = new Date(fromDate + 'T12:00:00').getDay();
  return addDays(fromDate, (want - have + 7) % 7);
}

// Copy of `plan` with every date moved so it starts on `alignedStart(...)`.
export function shiftPlan(plan, fromDate) {
  const first = planDates(plan)[0];
  if (!first) return plan;
  const start = alignedStart(plan, fromDate);
  const delta = Math.round((new Date(start + 'T12:00:00') - new Date(first + 'T12:00:00')) / 86400000);
  return {
    ...plan,
    startDate: start,
    weeks: plan.weeks.map(w => ({
      ...w,
      sessions: (w.sessions || []).map(s => (s.date ? { ...s, date: addDays(s.date.slice(0, 10), delta) } : s)),
    })),
  };
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
