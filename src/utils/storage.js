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
  weight: { entries: [], goalWeight: 85 },
};

const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const newId = () => crypto.randomUUID();

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

  cache.plan = planRes.data?.data || null;

  cache.completed = {};
  (completedRes.data || []).forEach(row => { cache.completed[row.session_id] = true; });

  cache.comments = {};
  (commentsRes.data || []).forEach(row => { cache.comments[row.session_id] = row.text; });

  cache.weight = {
    entries: (weightRes.data || []).map(e => ({ id: e.id, date: e.date, weight: Number(e.weight), type: e.type, note: e.note || '' })),
    goalWeight: goalRes.data?.goal_weight != null ? Number(goalRes.data.goal_weight) : 85,
  };
}

export function isStoreReady() {
  return !!cache.userId;
}

// ── Plan ─────────────────────────────────────────────────────────────────────
export const getPlan = () => cache.plan;

export function setPlan(plan) {
  cache.plan = plan;
  if (!cache.userId) return;
  supabase.from('plans').upsert({
    user_id: cache.userId,
    name: plan?.name || null,
    description: plan?.description || null,
    start_date: plan?.startDate || null,
    data: plan,
    updated_at: new Date().toISOString(),
  }).then(() => {});
}

export function clearPlan() {
  cache.plan = null;
  if (!cache.userId) return;
  supabase.from('plans').delete().eq('user_id', cache.userId).then(() => {});
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

  if (cache.userId) {
    if (nowCompleted) {
      supabase.from('completed_sessions').upsert({ user_id: cache.userId, session_id: sessionId }, { onConflict: 'user_id,session_id' }).then(() => {});
    } else {
      supabase.from('completed_sessions').delete().eq('user_id', cache.userId).eq('session_id', sessionId).then(() => {});
    }
  }
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

  if (cache.userId) {
    if (trimmed) {
      supabase.from('session_comments').upsert({ user_id: cache.userId, session_id: sessionId, text: trimmed, updated_at: new Date().toISOString() }, { onConflict: 'user_id,session_id' }).then(() => {});
    } else {
      supabase.from('session_comments').delete().eq('user_id', cache.userId).eq('session_id', sessionId).then(() => {});
    }
  }
  return next;
}

// ── Weight ───────────────────────────────────────────────────────────────────
export const getWeight = () => cache.weight;

export function addWeightEntry({ date, weight, type, note }) {
  const dup = cache.weight.entries.find(e => e.date === date && e.type === type);
  const entries = cache.weight.entries.filter(e => !(e.date === date && e.type === type));
  const entry = { id: newId(), date, weight, type, note: (note || '').trim() };
  cache.weight = { ...cache.weight, entries: [...entries, entry] };

  if (cache.userId) {
    (async () => {
      if (dup) await supabase.from('weight_entries').delete().eq('id', dup.id);
      await supabase.from('weight_entries').insert({ id: entry.id, user_id: cache.userId, date: entry.date, weight: entry.weight, type: entry.type, note: entry.note || null });
    })();
  }
  return cache.weight;
}

export function deleteWeightEntry(id) {
  cache.weight = { ...cache.weight, entries: cache.weight.entries.filter(e => e.id !== id) };
  if (cache.userId) {
    supabase.from('weight_entries').delete().eq('id', id).eq('user_id', cache.userId).then(() => {});
  }
  return cache.weight;
}

export function setGoalWeight(value) {
  cache.weight = { ...cache.weight, goalWeight: value };
  if (cache.userId) {
    supabase.from('weight_goals').upsert({ user_id: cache.userId, goal_weight: value }, { onConflict: 'user_id' }).then(() => {});
  }
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

  if (cache.userId) {
    (async () => {
      await supabase.from('weight_entries').delete().eq('user_id', cache.userId);
      if (entries.length) {
        await supabase.from('weight_entries').insert(
          entries.map(e => ({ id: e.id, user_id: cache.userId, date: e.date, weight: e.weight, type: e.type, note: e.note || null }))
        );
      }
    })();
  }
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
    if (cache.userId) {
      (async () => {
        await supabase.from('completed_sessions').delete().eq('user_id', cache.userId);
        const ids = Object.keys(data.completed || {}).filter(k => data.completed[k]);
        if (ids.length) await supabase.from('completed_sessions').insert(ids.map(session_id => ({ user_id: cache.userId, session_id })));
      })();
    }
  }
  if (data.comments !== undefined) {
    cache.comments = { ...data.comments };
    if (cache.userId) {
      (async () => {
        await supabase.from('session_comments').delete().eq('user_id', cache.userId);
        const entries = Object.entries(data.comments || {});
        if (entries.length) await supabase.from('session_comments').insert(entries.map(([session_id, text]) => ({ user_id: cache.userId, session_id, text })));
      })();
    }
  }
  if (data.weight !== undefined) {
    replaceWeightEntries(data.weight.entries || []);
    setGoalWeight(data.weight.goalWeight != null ? Number(data.weight.goalWeight) : 85);
  }
}

export function clearAll() {
  cache.plan = null;
  cache.completed = {};
  cache.comments = {};
  cache.weight = { entries: [], goalWeight: 85 };

  if (cache.userId) {
    const uid = cache.userId;
    Promise.all([
      supabase.from('plans').delete().eq('user_id', uid),
      supabase.from('completed_sessions').delete().eq('user_id', uid),
      supabase.from('session_comments').delete().eq('user_id', uid),
      supabase.from('weight_entries').delete().eq('user_id', uid),
      supabase.from('weight_goals').delete().eq('user_id', uid),
    ]).then(() => {});
  }
}
