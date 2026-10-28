import { useMemo, useState } from 'react';
import { C, GRADIENT, display, sessionKind, sessionColor, sessionSummary, isDistanceSession, KIND_LABEL, KIND_ICON } from '../utils/design.js';
import { getPlan, getCompleted, toggleCompleted, getWeight } from '../utils/storage.js';
import { isToday, todayStr, formatDateShort, trainingStreak } from '../utils/dateUtils.js';
import Icon from './Icon.jsx';
import AiChat from './AiChat.jsx';
import { Screen, GlassCard, Button, Ring, Logo } from './ui.jsx';

const fmtKg = (n) => n.toFixed(1).replace('.', ',');

function findCurrentWeek(plan) {
  if (!plan?.weeks?.length) return null;
  const today = todayStr();
  return plan.weeks.find(w => w.sessions?.some(s => isToday(s.date)))
    || plan.weeks.find(w => w.sessions?.some(s => s.date >= today))
    || null;
}

function Sparkline({ values, width = 120, height = 52 }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    4 + (i / (values.length - 1)) * (width - 8),
    6 + (1 - (v - min) / span) * (height - 12),
  ]);
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={C.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="4.5" fill={C.secondary} />
    </svg>
  );
}

// Splits "8 km" / "10,5km" into a big number and its unit for the hero card.
function splitDistance(distance) {
  const m = String(distance || '').match(/^\s*([\d.,]+)\s*([a-zA-Z]+)?/);
  return m ? { value: m[1], unit: m[2] || '' } : null;
}

function TodayCard({ session, completed, onToggle }) {
  const kind = sessionKind(session);
  const dist = isDistanceSession(session) ? splitDistance(session.distance) : null;
  const meta = dist
    ? [session.pace, session.effort].filter(Boolean).join(' · ')
    : sessionSummary(session);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 32, padding: 22, background: GRADIENT, color: C.onPrimary, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div aria-hidden="true" style={{ position: 'absolute', width: 200, height: 200, right: -60, top: -70, borderRadius: '50%', background: 'rgba(255,255,255,0.22)' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        <Icon name={KIND_ICON[kind]} size={18} color={C.onPrimary} />{KIND_LABEL[kind]}
      </div>
      {dist ? (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: display, fontSize: 64, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{dist.value}</div>
          <div style={{ fontFamily: display, fontSize: 22, fontWeight: 800 }}>{dist.unit}</div>
        </div>
      ) : null}
      <div style={{ position: 'relative', fontFamily: display, fontSize: dist ? 18 : 28, fontWeight: 800, lineHeight: 1.2 }}>{session.title}</div>
      {meta && <div style={{ position: 'relative', fontSize: 15, fontWeight: 600 }}>{meta}</div>}
      <Button variant="dark" icon="check" onClick={onToggle} style={{ position: 'relative', marginTop: 10 }}>
        {completed ? 'Hecho · desmarcar' : 'Marcar como hecho'}
      </Button>
    </div>
  );
}

const SHORT_LABEL = {
  gym: 'Gym', easy: 'Carrera', tempo: 'Tempo', long: 'Tirada larga', swim: 'Natación', bike: 'Bici',
  walk: 'Andar', treadmill: 'Cinta', pilates: 'Pilates', yoga: 'Yoga', stretch: 'Estiramientos', other: 'Entreno',
};

const TODAY_TITLE = {
  gym: 'Hoy toca gym', swim: 'Hoy toca nadar', bike: 'Hoy toca bici', walk: 'Hoy toca andar', treadmill: 'Hoy toca cinta',
  pilates: 'Hoy toca pilates', yoga: 'Hoy toca yoga', stretch: 'Hoy toca estirar', other: 'Hoy toca entrenar',
};

// Several workouts today: one gradient card listing each with its own check.
function MultiTodayCard({ sessions, completed, onToggle, onOpen }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 32, padding: 18, background: GRADIENT, color: C.onPrimary, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div aria-hidden="true" style={{ position: 'absolute', width: 200, height: 200, right: -60, top: -70, borderRadius: '50%', background: 'rgba(255,255,255,0.22)' }} />
      <div style={{ position: 'relative', fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '2px 4px 0' }}>
        {sessions.length} entrenos hoy
      </div>
      {sessions.map(s => {
        const kind = sessionKind(s);
        const done = !!completed[s.id];
        const meta = sessionSummary(s);
        return (
          <div key={s.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 24, background: 'rgba(42,10,20,0.12)', padding: '6px 6px 6px 10px' }}>
            <button onClick={onOpen} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: '6px 0', textAlign: 'left', color: C.onPrimary, opacity: done ? 0.6 : 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={KIND_ICON[kind]} size={22} color={C.onPrimary} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{KIND_LABEL[kind]}</div>
                <div style={{ fontFamily: display, fontSize: 18, fontWeight: 800, lineHeight: 1.2, textDecoration: done ? 'line-through' : 'none' }}>{s.title}</div>
                {meta && <div style={{ fontSize: 14, fontWeight: 600 }}>{meta}</div>}
              </div>
            </button>
            <button
              onClick={() => onToggle(s.id)}
              aria-label={done ? `Desmarcar ${s.title}` : `Marcar ${s.title} como hecho`}
              aria-pressed={done}
              style={{ width: 48, height: 48, borderRadius: '50%', border: done ? 'none' : '2px solid rgba(42,10,20,0.55)', background: done ? C.onPrimary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}
            >
              <Icon name="check" size={20} color={done ? '#FFB547' : C.onPrimary} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function Home({ onNavigate }) {
  const plan = getPlan();
  const [completed, setCompleted] = useState(() => getCompleted());
  const weight = getWeight();

  const week = useMemo(() => findCurrentWeek(plan), [plan]);
  const todaySessions = week ? week.sessions.filter(s => isToday(s.date) && s.type !== 'rest') : [];
  const nextSession = useMemo(() => {
    if (!plan?.weeks) return null;
    const today = todayStr();
    return plan.weeks.flatMap(w => w.sessions || []).find(s => s.type !== 'rest' && s.date > today) || null;
  }, [plan]);

  const active = week ? week.sessions.filter(s => s.type !== 'rest') : [];
  const doneCount = active.filter(s => completed[s.id]).length;
  const weekIndex = week ? plan.weeks.indexOf(week) + 1 : 0;
  const streak = useMemo(() => trainingStreak(plan, completed), [plan, completed]);
  const days = (n) => `${n} día${n === 1 ? '' : 's'}`;
  const streakNote = streak.current === 0
    ? (streak.missedBefore ? 'Vuelve a empezar hoy' : 'Empieza hoy')
    : streak.best > streak.current ? `Mejor: ${days(streak.best)}` : 'Sin fallar un entreno';

  const sorted = [...(weight.entries || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const delta = latest && prev ? latest.weight - prev.weight : null;

  const rawDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
  const title = !plan ? 'Hola'
    : todaySessions.length === 0 ? 'Hoy toca descansar'
    : todaySessions.length > 1 ? `Hoy tienes ${todaySessions.length} entrenos`
    : TODAY_TITLE[sessionKind(todaySessions[0])] || 'Hoy toca correr';

  return (
    <Screen>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, marginBottom: 14 }}>
        <Logo />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: C.textMid }}>{dateLabel}</div>
        <h1 style={{ margin: 0, fontFamily: display, fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
        {todaySessions.length > 1 && (
          <div style={{ fontSize: 16, color: C.textMid, marginTop: 6, lineHeight: 1.45 }}>
            {todaySessions.map((s, i) => (
              <span key={s.id}>
                {i > 0 && ' + '}
                <span style={{ color: sessionColor(s), fontWeight: 700 }}>{SHORT_LABEL[sessionKind(s)]}</span>
                {(s.distance || s.subtitle) && ` ${s.distance || s.subtitle}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!plan ? (
          <GlassCard radius={30} padding={22} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: display, fontSize: 22, fontWeight: 800 }}>Sin plan activo</div>
            <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.55 }}>Genera tu plan con el prompt de Ajustes e impórtalo en Entrenos.</div>
            <Button icon="download" onClick={() => onNavigate('training')} style={{ marginTop: 6 }}>Importar plan</Button>
          </GlassCard>
        ) : todaySessions.length > 1 ? (
          <MultiTodayCard sessions={todaySessions} completed={completed} onToggle={(id) => setCompleted(toggleCompleted(id))} onOpen={() => onNavigate('training')} />
        ) : todaySessions.length === 1 ? (
          <TodayCard session={todaySessions[0]} completed={!!completed[todaySessions[0].id]} onToggle={() => setCompleted(toggleCompleted(todaySessions[0].id))} />
        ) : (
          <GlassCard radius={30} padding={20} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.inset, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="rest" size={22} color={C.textMid} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Día de descanso</div>
              {nextSession && (
                <div style={{ fontSize: 14, color: C.textMid, marginTop: 2 }}>
                  Próximo: <span style={{ color: sessionColor(nextSession), fontWeight: 600 }}>{nextSession.title}</span> · {nextSession.dayName} {formatDateShort(nextSession.date)}
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {week && active.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <GlassCard as="button" onClick={() => onNavigate('training')} padding={16} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', color: C.text, width: '100%' }}>
              <Ring size={56} value={doneCount / active.length} label={`${doneCount} de ${active.length} entrenos esta semana`}>
                <span style={{ fontFamily: display, fontSize: 14, fontWeight: 800 }}>{doneCount}/{active.length}</span>
              </Ring>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: C.textMid }}>{week.isRecovery ? 'Recuperación' : 'Semana'}</div>
                <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>{weekIndex} de {plan.weeks.length}</div>
              </div>
            </GlassCard>
            <GlassCard padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 13, color: C.textMid }}>Racha</div>
              <div style={{ fontFamily: display, fontSize: 26, fontWeight: 800, lineHeight: 1.15, color: streak.current ? C.text : C.textMid }}>{days(streak.current)}</div>
              <div style={{ fontSize: 13, color: C.textMid }}>{streakNote}</div>
            </GlassCard>
          </div>
        )}

        <GlassCard as="button" onClick={() => onNavigate('weight')} padding="16px 18px" style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', color: C.text, width: '100%' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 14, color: C.textMid }}>Peso{weight.goalWeight != null ? ` · meta ${fmtKg(weight.goalWeight)} kg` : ''}</div>
            <div style={{ fontFamily: display, fontSize: 26, fontWeight: 800 }}>{latest ? `${fmtKg(latest.weight)} kg` : 'Sin registros'}</div>
            {delta != null && (
              <div style={{ fontSize: 14, fontWeight: 700, color: delta <= 0 ? C.success : C.dangerText }}>
                {delta <= 0 ? '−' : '+'}{fmtKg(Math.abs(delta))} kg desde el anterior
              </div>
            )}
            {!latest && <div style={{ fontSize: 14, color: C.textMid }}>Registra tu primer peso</div>}
          </div>
          <Sparkline values={sorted.slice(-8).map(e => e.weight)} />
        </GlassCard>

        <AiChat
          mode="training"
          context={{ planName: plan?.name, today: todaySessions.map(s => s.title).join(' + ') }}
          renderTrigger={(openChat) => (
            <GlassCard as="button" onClick={openChat} radius={999} padding="0 12px" style={{ height: 60, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', color: C.text, width: '100%' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.accent + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="sparkle" size={18} color={C.accentText} />
              </div>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Pregunta a tu coach IA</div>
              <Icon name="chevron" size={18} color={C.textMid} />
            </GlassCard>
          )}
        />
      </div>
    </Screen>
  );
}
