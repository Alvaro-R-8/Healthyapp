export function isPast(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return d < today;
}

export function isToday(dateStr) {
  const today = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return today.toDateString() === d.toDateString();
}

export function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function formatDateMini(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' });
}

export function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export function getMonthShort(monthKey) {
  const [year, month] = monthKey.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
}

// Calendar-day key for a session: tolerates stray spaces or a time suffix in
// the plan's date, falling back to the day name when there is no date.
export const dayKey = (s) => String(s?.date || '').trim().slice(0, 10) || s?.dayName || '';

// One entry per calendar day, in plan order. A day with both a rest entry and
// a workout counts as a training day.
export function groupByDay(sessions = []) {
  const days = [];
  const byKey = {};
  sessions.forEach(s => {
    const key = dayKey(s);
    let day = byKey[key];
    if (!day) {
      day = byKey[key] = { date: key, dayName: s.dayName, sessions: [], training: [] };
      days.push(day);
    }
    day.sessions.push(s);
    if (s.type !== 'rest') day.training.push(s);
  });
  return days;
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Local calendar date as YYYY-MM-DD (todayStr() is UTC, which is the wrong
// day for a few hours around midnight in Spain).
export function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Streak of consecutive training days fully completed, walking back from
// today. Rest days neither count nor break it; a past day with any workout
// left undone breaks it; today only adds once everything is done (it never
// breaks it). `best` is the longest such run up to today.
export function trainingStreak(plan, completed = {}, today = localToday()) {
  const days = groupByDay((plan?.weeks || []).flatMap(w => w.sessions || []))
    .filter(d => d.training.length && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && d.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const done = (d) => d.training.every(s => completed[s.id]);

  let best = 0;
  let run = 0;
  for (const d of days) {
    if (done(d)) best = Math.max(best, ++run);
    else if (d.date < today) run = 0;
  }

  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (done(d)) current++;
    else if (d.date < today) break;
  }
  return { current, best, missedBefore: days.some(d => d.date < today && !done(d)) };
}
