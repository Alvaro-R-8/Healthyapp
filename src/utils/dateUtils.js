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

// One entry per calendar day, in plan order. A day with both a rest entry and
// a workout counts as a training day.
export function groupByDay(sessions = []) {
  const days = [];
  const byDate = {};
  sessions.forEach(s => {
    let day = byDate[s.date];
    if (!day) {
      day = byDate[s.date] = { date: s.date, dayName: s.dayName, sessions: [], training: [] };
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
