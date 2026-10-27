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
