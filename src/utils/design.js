// App name lives here so a rename touches one place (plus index.html/manifest).
export const APP_NAME = 'Kora';

// ── Palettes ─────────────────────────────────────────────────────────────────
// Every value that gets alpha appended in components (`C.x + '22'`) must stay a
// 6-digit hex; rgba() values are only used as-is.
const dark = {
  mode: 'dark',
  bg: '#140B12',
  bgElevated: '#1E1219',
  glass: 'rgba(255,255,255,0.06)',
  glassStrong: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.12)',
  navBg: 'rgba(36,20,32,0.78)',
  overlay: 'rgba(8,4,7,0.72)',
  inset: 'rgba(20,11,18,0.45)',
  text: '#FFF5F2',
  textMid: '#C4A9B3',
  textLow: '#9C8590',
  primary: '#FF5E7E',
  primaryText: '#FF8FA6',
  onPrimary: '#2A0A14',
  secondary: '#FFB547',
  accent: '#A78BFA',
  accentText: '#C9B8FF',
  success: '#5EEAD4',
  danger: '#F43F5E',
  dangerText: '#FB7185',
  line: '#3A2532',
  aurora1: 'rgba(255,94,126,0.40)',
  aurora2: 'rgba(167,139,250,0.26)',
};

const light = {
  mode: 'light',
  bg: '#FFF7F3',
  bgElevated: '#FFFFFF',
  glass: 'rgba(255,255,255,0.72)',
  glassStrong: 'rgba(255,255,255,0.90)',
  glassBorder: 'rgba(42,20,32,0.09)',
  navBg: 'rgba(255,255,255,0.84)',
  overlay: 'rgba(42,20,32,0.38)',
  inset: 'rgba(42,20,32,0.05)',
  text: '#2A1420',
  textMid: '#7A5563',
  textLow: '#8A6574',
  primary: '#FF5E7E',
  primaryText: '#C42E55',
  onPrimary: '#2A0A14',
  secondary: '#9A5B00',
  accent: '#6D4AE0',
  accentText: '#6D4AE0',
  success: '#0B6E62',
  danger: '#BE123C',
  dangerText: '#BE123C',
  line: '#EAD9DE',
  aurora1: 'rgba(255,94,126,0.24)',
  aurora2: 'rgba(255,181,71,0.26)',
};

// Legacy names still referenced by some components.
function withAliases(p) {
  return {
    ...p,
    surface: p.bgElevated,
    surfaceHigh: p.bgElevated,
    border: p.line,
    borderHigh: p.line,
    blue: p.accent,
    lime: p.primary,
    green: p.success,
    amber: p.secondary,
    red: p.danger,
    purple: p.accent,
  };
}

export const palettes = { dark: withAliases(dark), light: withAliases(light) };

// Mutable on purpose: applyTheme swaps the values and App re-renders from the
// root, so every `C.x` read picks up the new theme without threading context.
export const C = { ...palettes.dark };

export const GRADIENT = 'linear-gradient(135deg, #FF5E7E, #FFB547)';

export const display = "'Plus Jakarta Sans', 'Inter', sans-serif";
export const sans = "'Inter', system-ui, sans-serif";
export const mono = sans;

// ── Theme ────────────────────────────────────────────────────────────────────
const THEME_KEY = 'kora_theme';

export function getThemePref() {
  try { return localStorage.getItem(THEME_KEY) || 'system'; } catch { return 'system'; }
}

export function setThemePref(pref) {
  try { localStorage.setItem(THEME_KEY, pref); } catch {}
}

export function resolveTheme(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  try { return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch { return 'dark'; }
}

export function applyTheme(mode) {
  const p = palettes[mode] || palettes.dark;
  Object.assign(C, p);
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  root.style.setProperty('--bg', p.bg);
  root.style.setProperty('--text', p.text);
  root.style.setProperty('--line', p.line);
  root.style.setProperty('--aurora1', p.aurora1);
  root.style.setProperty('--aurora2', p.aurora2);
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.setAttribute('content', p.bg);
}

// ── Session colors ───────────────────────────────────────────────────────────
// Plans store a hex per session (old palette or the one the prompt now asks for);
// map it, plus the type, to the current theme so imported plans recolor too.
const LEGACY_RUN = {
  '#22c55e': 'easy', '#f59e0b': 'tempo', '#a855f7': 'long',
  '#5eead4': 'easy', '#ffb547': 'tempo', '#ff5e7e': 'long',
};

// Explicit `type` values the plan may use, mapped to a kind.
const TYPE_KIND = {
  gym: 'gym', swim: 'swim', bike: 'bike', cycling: 'bike', bici: 'bike',
  walk: 'walk', walking: 'walk', treadmill: 'treadmill',
  pilates: 'pilates', yoga: 'yoga', stretch: 'stretch', stretching: 'stretch',
  other: 'other',
};

// Fallback when the type is missing or generic: guess from the text.
const TEXT_KIND = [
  [/nataci|nadar|swim|piscina|crol/, 'swim'],
  [/bici|ciclismo|spinning|bike|cycling/, 'bike'],
  [/(cinta|treadmill).*(andar|caminar|walk)|(andar|caminar|walk).*(cinta|treadmill)/, 'treadmill'],
  [/\bandar\b|caminar|caminata|paseo|walk/, 'walk'],
  [/pilates/, 'pilates'],
  [/yoga/, 'yoga'],
  [/estiramient|stretch|movilidad/, 'stretch'],
];

export function sessionKind(session) {
  if (!session || session.type === 'rest') return 'rest';
  const type = String(session.type || '').toLowerCase();
  if (TYPE_KIND[type]) return TYPE_KIND[type];
  const t = `${session.title || ''} ${session.subtitle || ''}`.toLowerCase();
  if (type !== 'run') {
    const guess = TEXT_KIND.find(([re]) => re.test(t));
    return guess ? guess[1] : 'other';
  }
  const legacy = LEGACY_RUN[(session.color || '').toLowerCase()];
  if (legacy) return legacy;
  if (/larg/.test(t)) return 'long';
  if (/tempo|interval|series|fartlek|ritmo/.test(t)) return 'tempo';
  return 'easy';
}

export const KIND_LABEL = {
  gym: 'Gym', easy: 'Carrera fácil', tempo: 'Tempo / series', long: 'Carrera larga', swim: 'Natación',
  bike: 'Ciclismo', walk: 'Andar', treadmill: 'Andar en cinta', pilates: 'Pilates', yoga: 'Yoga',
  stretch: 'Estiramientos', other: 'Otros', rest: 'Descanso',
};

// Icon per discipline: every kind of run shares the runner, the label and
// color tell easy/tempo/long apart.
export const KIND_ICON = {
  gym: 'gym', easy: 'run', tempo: 'run', long: 'run', swim: 'swim', bike: 'bike', walk: 'walk',
  treadmill: 'treadmill', pilates: 'pilates', yoga: 'yoga', stretch: 'stretch', other: 'activity', rest: 'rest',
};

// [dark, light] per kind; families share a color and differ by icon/label.
const KIND_COLOR = {
  tempo: ['#FFB547', '#9A5B00'],
  long: ['#FF5E7E', '#C42E55'],
  swim: ['#38BDF8', '#0369A1'],
  bike: ['#A3E635', '#4D7C0F'],
  walk: ['#86EFAC', '#15803D'],
  treadmill: ['#86EFAC', '#15803D'],
  pilates: ['#F0ABFC', '#A21CAF'],
  yoga: ['#F0ABFC', '#A21CAF'],
  stretch: ['#F0ABFC', '#A21CAF'],
  other: ['#CBD5E1', '#475569'],
};

export function sessionColor(session) {
  const kind = sessionKind(session);
  if (kind === 'gym') return C.accent;
  if (kind === 'rest') return C.textLow;
  if (kind === 'easy') return C.success;
  return KIND_COLOR[kind][C.mode === 'light' ? 1 : 0];
}

// Sessions measured by distance (runs and swims) show distance/pace stats.
const DISTANCE_KINDS = ['easy', 'tempo', 'long', 'swim', 'bike', 'walk', 'treadmill'];
export const isDistanceSession = (session) => DISTANCE_KINDS.includes(sessionKind(session));

// Short "what is it" line: distance and pace, or duration and exercise count.
export function sessionSummary(session) {
  if (!session) return '';
  if (isDistanceSession(session)) return [session.distance || session.subtitle, session.pace].filter(Boolean).join(' · ');
  const n = session.exercises?.length;
  return [session.subtitle, n ? `${n} ejercicio${n === 1 ? '' : 's'}` : null].filter(Boolean).join(' · ');
}

// Kilometres of an on-foot session (runs, walking, treadmill) from its
// distance text ("8 km", "6,6km", "8-10 km" → first number). Other kinds and
// distances in metres return 0, matching the plan's weekly running km.
const KM_KINDS = ['easy', 'tempo', 'long', 'walk', 'treadmill'];
export function sessionKm(session) {
  if (!KM_KINDS.includes(sessionKind(session))) return 0;
  const m = String(session.distance || '').match(/(\d+(?:[.,]\d+)?)(?:\s*[-–a]\s*\d+(?:[.,]\d+)?)?\s*km/i);
  return m ? parseFloat(m[1].replace(',', '.')) : 0;
}

export const fmtKm = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');
