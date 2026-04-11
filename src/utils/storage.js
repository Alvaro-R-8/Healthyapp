const KEYS = {
  PLAN: 'happ_plan',
  COMPLETED: 'happ_completed',
  COMMENTS: 'happ_comments',
  WEIGHT: 'happ_weight',
  API_KEY: 'happ_api_key',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── Plan ─────────────────────────────────────────────────────────────────────
export const getPlan = () => read(KEYS.PLAN, null);
export const setPlan = (plan) => write(KEYS.PLAN, plan);
export const clearPlan = () => { try { localStorage.removeItem(KEYS.PLAN); } catch {} };

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
export const getCompleted = () => read(KEYS.COMPLETED, {});

export function toggleCompleted(sessionId) {
  const completed = getCompleted();
  const next = { ...completed };
  if (next[sessionId]) {
    delete next[sessionId];
  } else {
    next[sessionId] = true;
  }
  write(KEYS.COMPLETED, next);
  return next;
}

// ── Comments ─────────────────────────────────────────────────────────────────
export const getComments = () => read(KEYS.COMMENTS, {});

export function setComment(sessionId, text) {
  const comments = getComments();
  const next = { ...comments };
  if (text && text.trim()) next[sessionId] = text.trim();
  else delete next[sessionId];
  write(KEYS.COMMENTS, next);
  return next;
}

// ── Weight ───────────────────────────────────────────────────────────────────
export const getWeight = () => read(KEYS.WEIGHT, { entries: [], goalWeight: 85 });
export const setWeight = (data) => write(KEYS.WEIGHT, data);

// ── API Key ──────────────────────────────────────────────────────────────────
export const getApiKey = () => { try { return localStorage.getItem(KEYS.API_KEY) || ''; } catch { return ''; } };
export const setApiKey = (key) => { try { localStorage.setItem(KEYS.API_KEY, key); } catch {} };
export const clearApiKey = () => { try { localStorage.removeItem(KEYS.API_KEY); } catch {} };

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
  if (data.plan !== undefined) write(KEYS.PLAN, data.plan);
  if (data.completed !== undefined) write(KEYS.COMPLETED, data.completed);
  if (data.comments !== undefined) write(KEYS.COMMENTS, data.comments);
  if (data.weight !== undefined) write(KEYS.WEIGHT, data.weight);
}

export function clearAll() {
  Object.values(KEYS).forEach(k => {
    try { localStorage.removeItem(k); } catch {}
  });
}
