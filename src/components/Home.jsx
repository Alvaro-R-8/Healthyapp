import { useMemo, useState } from 'react';
import { C, GRADIENT, display, sessionKind, sessionColor, KIND_LABEL } from '../utils/design.js';
import { getPlan, getCompleted, toggleCompleted, getWeight } from '../utils/storage.js';
import { isToday, todayStr, formatDateShort } from '../utils/dateUtils.js';
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
  const dist = session.type === 'run' ? splitDistance(session.distance) : null;
  const meta = session.type === 'run'
    ? [session.pace, session.effort].filter(Boolean).join(' · ')
    : session.subtitle;
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 32, padding: 22, background: GRADIENT, color: C.onPrimary, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div aria-hidden="true" style={{ position: 'absolute', width: 200, height: 200, right: -60, top: -70, borderRadius: '50%', background: 'rgba(255,255,255,0.22)' }} />
      <div style={{ position: 'relative', fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{KIND_LABEL[kind]}</div>
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

const KIND_ICON = { gym: 'gym', easy: 'run', tempo: 'pace', long: 'long' };

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
        const meta = s.type === 'run' ? [s.distance, s.pace].filter(Boolean).join(' · ') : s.subtitle;
        return (
          <div key={s.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 24, background: 'rgba(42,10,20,0.12)', padding: '6px 6px 6px 10px' }}>
            <button onClick={onOpen} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: '6px 0', textAlign: 'left', color: C.onPrimary, opacity: done ? 0.6 : 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={KIND_ICON[kind] || 'run'} size={21} color={C.onPrimary} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{KIND_LABEL[kind]}</div>
                <div style={{ fontFamily: display, fontSize: 18, fontWeight: 800, lineHeight: 1.2, textDecoration: done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
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

  const sorted = [...(weight.entries || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const delta = latest && prev ? latest.weight - prev.weight : null;

  const rawDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
  const title = !plan ? 'Hola'
    : todaySessions.length === 0 ? 'Hoy toca descansar'
    : todaySessions.length > 1 ? `Hoy tienes ${todaySessions.length} entrenos`
    : todaySessions[0].type === 'gym' ? 'Hoy toca gym' : 'Hoy toca correr';

  return (
    <Screen>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, marginBottom: 14 }}>
        <Logo />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: C.textMid }}>{dateLabel}</div>
        <h1 style={{ margin: 0, fontFamily: display, fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
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
          <GlassCard padding={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Ring size={60} value={doneCount / active.length} label={`${doneCount} de ${active.length} entrenos esta semana`}>
              <span style={{ fontFamily: display, fontSize: 15, fontWeight: 800 }}>{doneCount}/{active.length}</span>
            </Ring>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{week.label || `Semana ${weekIndex}`}</div>
              <div style={{ fontSize: 14, color: C.textMid }}>
                {weekIndex} de {plan.weeks.length}{week.totalKm > 0 ? ` · ${week.totalKm} km` : ''}{week.isRecovery ? ' · recuperación' : ''}
              </div>
            </div>
            <button onClick={() => onNavigate('training')} aria-label="Ver semana" style={{ background: 'none', border: 'none', padding: 8 }}>
              <Icon name="chevron" size={18} color={C.textMid} />
            </button>
          </GlassCard>
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
