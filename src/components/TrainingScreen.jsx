import { useState, useEffect, useRef } from 'react';
import { C, display, sessionKind, sessionColor, sessionSummary, isDistanceSession, KIND_LABEL, KIND_ICON } from '../utils/design.js';
import { getPlan, setPlan, replacePlan, getCompleted, toggleCompleted, updateSessionInPlan, getComments, setComment } from '../utils/storage.js';
import { isPast, isToday, formatDateShort, todayStr, groupByDay, dayKey } from '../utils/dateUtils.js';
import Icon from './Icon.jsx';
import AiChat from './AiChat.jsx';
import { Screen, ScreenHeader, GlassCard, Label, Button, IconButton, Chip, Sheet, Toast, Field, inputStyle } from './ui.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────
const effortColor = (effort) => ({
  'Muy fácil': C.success, 'Fácil': C.success, 'Moderado': C.secondary,
  'Exigente': C.primaryText, 'Intenso': C.dangerText,
}[effort] || C.textMid);

const dayNum = (date) => date ? new Date(date + 'T12:00:00').getDate() : '';

function findCurrentWeekIdx(plan) {
  if (!plan?.weeks?.length) return 0;
  const today = todayStr();
  const idx = plan.weeks.findIndex(w => w.sessions?.some(s => s.date >= today));
  return idx >= 0 ? idx : plan.weeks.length - 1;
}

function defaultDate(week) {
  const days = groupByDay(week?.sessions);
  if (!days.length) return null;
  return (days.find(d => isToday(d.date))
    || days.find(d => d.training.length && !isPast(d.date))
    || days.find(d => d.training.length)
    || days[0]).date;
}

const plural = (n) => `${n} entreno${n === 1 ? '' : 's'}`;

// ── Session detail (inline card) ─────────────────────────────────────────────
function SessionCard({ session, completed, onToggle, onEdit, comment, onSaveComment, onCollapse }) {
  const [commentText, setCommentText] = useState(comment || '');
  const [commentSaved, setCommentSaved] = useState(false);
  useEffect(() => { setCommentText(comment || ''); setCommentSaved(false); }, [session.id]);

  const kind = sessionKind(session);
  const color = sessionColor(session);
  const today = isToday(session.date);
  const past = isPast(session.date);

  if (session.type === 'rest') {
    return (
      <GlassCard radius={30} padding={20} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.inset, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="rest" size={22} color={C.textMid} />
        </div>
        <div>
          <Label>{session.dayName} {formatDateShort(session.date)}{today ? ' · hoy' : ''}</Label>
          <div style={{ fontFamily: display, fontSize: 20, fontWeight: 800, marginTop: 2 }}>Descanso</div>
        </div>
      </GlassCard>
    );
  }

  const stats = isDistanceSession(session)
    ? [
        session.distance && { label: 'Distancia', value: session.distance, color },
        session.pace && { label: 'Ritmo', value: session.pace, color: C.text },
        session.effort && { label: 'Esfuerzo', value: session.effort, color: effortColor(session.effort) },
      ].filter(Boolean)
    : [];

  return (
    <GlassCard radius={30} padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 14, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <Label color={color}>{today ? 'Hoy' : `${session.dayName} ${formatDateShort(session.date)}`} · {KIND_LABEL[kind]}</Label>
          <div style={{ fontFamily: display, fontSize: 24, fontWeight: 800, lineHeight: 1.2, marginTop: 4 }}>{session.title}</div>
          {session.subtitle && <div style={{ fontSize: 15, color: C.textMid, marginTop: 4 }}>{session.subtitle}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {!past && <IconButton icon="edit" label="Editar sesión" onClick={onEdit} size={40} />}
          {onCollapse && (
            <button onClick={onCollapse} aria-label="Plegar" aria-expanded="true" style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${C.glassBorder}`, background: C.glass, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transform: 'rotate(180deg)' }}>
              <Icon name="chevronDown" size={20} color={C.textMid} />
            </button>
          )}
        </div>
      </div>

      {stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`, gap: 8 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: C.inset, borderRadius: 18, padding: '10px 12px' }}>
              <div style={{ fontSize: 12, color: C.textMid }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {session.blocks?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {session.blocks.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 18, background: C.inset }}>
              <div style={{ minWidth: 58, fontSize: 14, fontWeight: 700, color }}>{b.duration}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{b.name}</div>
                {b.description && <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.5, marginTop: 2 }}>{b.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {session.exercises?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {session.exercises.map((ex, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 18, background: C.inset }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{ex.name}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>{ex.sets}×{ex.reps}</div>
              </div>
              {(ex.rest || ex.notes) && (
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13, color: C.textMid }}>
                  {ex.rest && <span>Descanso {ex.rest}</span>}
                  {ex.notes && <span>{ex.notes}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {session.notes && (
        <div style={{ padding: '12px 14px', borderRadius: 18, background: C.inset }}>
          <Label color={C.secondary} style={{ marginBottom: 4 }}>Nota del plan</Label>
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>{session.notes}</div>
        </div>
      )}

      <div style={{ padding: '12px 14px', borderRadius: 18, border: `1px solid ${C.glassBorder}` }}>
        <Label style={{ marginBottom: 6 }}>Mis notas</Label>
        <textarea
          aria-label="Mis notas de la sesión"
          value={commentText}
          onChange={e => { setCommentText(e.target.value); setCommentSaved(false); }}
          placeholder="Cómo fue la sesión, sensaciones, qué ajustar..."
          rows={2}
          style={{ width: '100%', background: 'transparent', border: 'none', padding: 0, color: C.text, fontSize: 15, outline: 'none', resize: 'none', lineHeight: 1.5 }}
        />
        {(commentText !== (comment || '') || commentSaved) && (
          <button
            onClick={() => { onSaveComment(session.id, commentText); setCommentSaved(true); }}
            style={{ marginTop: 6, height: 36, padding: '0 14px', borderRadius: 999, border: 'none', background: commentSaved ? C.success + '2e' : C.glassStrong, color: commentSaved ? C.success : C.text, fontSize: 13, fontWeight: 700 }}
          >
            {commentSaved ? '✓ Guardado' : 'Guardar nota'}
          </button>
        )}
      </div>

      <Button variant={completed ? 'success' : 'primary'} icon="check" onClick={onToggle}>
        {completed ? 'Completada · desmarcar' : 'Marcar como hecho'}
      </Button>
    </GlassCard>
  );
}

// Folded session inside a day with several workouts; tapping it unfolds the card.
function SessionRow({ session, completed, onExpand, onToggle }) {
  const kind = sessionKind(session);
  const color = sessionColor(session);
  const summary = sessionSummary(session);
  return (
    <GlassCard radius={26} padding="8px 8px 8px 12px" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button onClick={onExpand} aria-expanded="false" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: '6px 0', textAlign: 'left', color: C.text }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: color + '2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={KIND_ICON[kind]} size={24} color={color} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Label color={color}>{KIND_LABEL[kind]}</Label>
          <div style={{ fontFamily: display, fontSize: 18, fontWeight: 800, lineHeight: 1.25, marginTop: 2, textDecoration: completed ? 'line-through' : 'none', opacity: completed ? 0.65 : 1 }}>{session.title}</div>
          {summary && <div style={{ fontSize: 14, color: C.textMid, marginTop: 1 }}>{summary}</div>}
        </div>
        <Icon name="chevronDown" size={20} color={C.textMid} />
      </button>
      <button
        onClick={onToggle}
        aria-label={completed ? `Desmarcar ${session.title}` : `Marcar ${session.title} como hecho`}
        aria-pressed={completed}
        style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <span style={{ width: 32, height: 32, borderRadius: '50%', boxSizing: 'border-box', border: completed ? 'none' : `2px solid ${C.glassBorder}`, background: completed ? C.success : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {completed && <Icon name="check" size={16} color={C.mode === 'light' ? '#FFFFFF' : '#0B2E2A'} />}
        </span>
      </button>
    </GlassCard>
  );
}

// ── Edit sheets ───────────────────────────────────────────────────────────────
function SmallButton({ children, onClick, color }) {
  return (
    <button onClick={onClick} style={{ height: 34, padding: '0 12px', borderRadius: 999, border: 'none', background: C.glassStrong, color: color || C.text, fontSize: 13, fontWeight: 700 }}>
      {children}
    </button>
  );
}

function EditRunSheet({ session, onSave, onClose }) {
  const [title, setTitle] = useState(session.title || '');
  const [distance, setDistance] = useState(session.distance || '');
  const [pace, setPace] = useState(session.pace || '');
  const [effort, setEffort] = useState(session.effort || 'Fácil');
  const [notes, setNotes] = useState(session.notes || '');
  const [blocks, setBlocks] = useState(session.blocks ? JSON.parse(JSON.stringify(session.blocks)) : []);

  const addBlock = () => setBlocks(p => [...p, { name: '', duration: '', description: '' }]);
  const removeBlock = i => setBlocks(p => p.filter((_, idx) => idx !== i));
  const updateBlock = (i, field, val) => setBlocks(p => p.map((b, idx) => idx === i ? { ...b, [field]: val } : b));

  const inp = inputStyle();

  return (
    <Sheet title={sessionKind(session) === 'swim' ? 'Editar natación' : 'Editar carrera'} onClose={onClose} footer={<Button onClick={() => onSave({ title, distance, pace, effort, notes, blocks })}>Guardar cambios</Button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Título"><input style={inp} value={title} onChange={e => setTitle(e.target.value)} /></Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Distancia" style={{ flex: 1 }}><input style={inp} value={distance} onChange={e => setDistance(e.target.value)} placeholder="ej: 5 km" /></Field>
          <Field label="Ritmo" style={{ flex: 1 }}><input style={inp} value={pace} onChange={e => setPace(e.target.value)} placeholder="ej: 6:30 /km" /></Field>
        </div>
        <Field label="Esfuerzo">
          <select style={inp} value={effort} onChange={e => setEffort(e.target.value)}>
            {['Muy fácil', 'Fácil', 'Moderado', 'Exigente', 'Intenso'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Nota del entrenador"><textarea style={{ ...inp, resize: 'none' }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>Bloques</span>
            <SmallButton onClick={addBlock} color={C.primaryText}>+ Añadir</SmallButton>
          </div>
          {blocks.map((b, i) => (
            <div key={i} style={{ background: C.inset, borderRadius: 18, padding: 12, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input aria-label="Nombre del bloque" style={{ ...inp, flex: 1 }} placeholder="Nombre bloque" value={b.name} onChange={e => updateBlock(i, 'name', e.target.value)} />
                <input aria-label="Duración" style={{ ...inp, width: 96 }} placeholder="Duración" value={b.duration} onChange={e => updateBlock(i, 'duration', e.target.value)} />
                <IconButton icon="close" label="Quitar bloque" onClick={() => removeBlock(i)} size={36} color={C.dangerText} />
              </div>
              <input aria-label="Descripción" style={inp} placeholder="Descripción" value={b.description} onChange={e => updateBlock(i, 'description', e.target.value)} />
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function EditGymSheet({ session, onSave, onClose }) {
  const [title, setTitle] = useState(session.title || '');
  const [subtitle, setSubtitle] = useState(session.subtitle || '');
  const [exercises, setExercises] = useState(session.exercises ? JSON.parse(JSON.stringify(session.exercises)) : []);

  const addEx = () => setExercises(p => [...p, { name: '', sets: 3, reps: '12', rest: '60s', notes: '' }]);
  const removeEx = i => setExercises(p => p.filter((_, idx) => idx !== i));
  const updateEx = (i, field, val) => setExercises(p => p.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const inp = inputStyle();

  return (
    <Sheet title="Editar gym" onClose={onClose} footer={<Button onClick={() => onSave({ title, subtitle, exercises })}>Guardar cambios</Button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Título" style={{ flex: 2 }}><input style={inp} value={title} onChange={e => setTitle(e.target.value)} /></Field>
          <Field label="Subtítulo" style={{ flex: 1 }}><input style={inp} value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="ej: 35 min" /></Field>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>Ejercicios</span>
            <SmallButton onClick={addEx} color={C.primaryText}>+ Añadir</SmallButton>
          </div>
          {exercises.map((ex, i) => (
            <div key={i} style={{ background: C.inset, borderRadius: 18, padding: 12, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input aria-label="Nombre del ejercicio" style={{ ...inp, flex: 1 }} placeholder="Nombre ejercicio" value={ex.name} onChange={e => updateEx(i, 'name', e.target.value)} />
                <IconButton icon="close" label="Quitar ejercicio" onClick={() => removeEx(i)} size={36} color={C.dangerText} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                <input aria-label="Series" style={inp} placeholder="Series" value={ex.sets} onChange={e => updateEx(i, 'sets', e.target.value)} />
                <input aria-label="Repeticiones" style={inp} placeholder="Reps" value={ex.reps} onChange={e => updateEx(i, 'reps', e.target.value)} />
                <input aria-label="Descanso" style={inp} placeholder="Desc." value={ex.rest} onChange={e => updateEx(i, 'rest', e.target.value)} />
              </div>
              <input aria-label="Notas" style={inp} placeholder="Notas" value={ex.notes} onChange={e => updateEx(i, 'notes', e.target.value)} />
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function ImportSheet({ onImport, onClose }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const tryImport = () => {
    setError('');
    try {
      const data = JSON.parse(text.trim());
      if (!data.id || !data.name || !Array.isArray(data.weeks)) {
        setError('El JSON no tiene el formato correcto. Debe tener: id, name, weeks[]');
        return;
      }
      onImport(data);
    } catch {
      setError('JSON inválido. Comprueba que has copiado el texto completo.');
    }
  };

  return (
    <Sheet
      eyebrow={{ text: 'Importar plan', color: C.primaryText }}
      title="Pega el JSON de tu plan"
      onClose={onClose}
      footer={<Button onClick={tryImport} disabled={!text.trim()}>Cargar plan</Button>}
    >
      <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.55, marginBottom: 12 }}>
        Genera el plan en Claude con el prompt de Ajustes, pega aquí el JSON y cárgalo. Sustituye al plan actual.
      </div>
      <textarea
        aria-label="JSON del plan"
        value={text}
        onChange={e => { setText(e.target.value); setError(''); }}
        placeholder={'{\n  "id": "mi-plan",\n  "name": "Mi plan de running",\n  "weeks": [...]\n}'}
        rows={10}
        style={{ ...inputStyle(), fontSize: 13, fontFamily: 'ui-monospace, Menlo, monospace', resize: 'none', lineHeight: 1.55, borderColor: error ? C.danger : C.glassBorder }}
      />
      {error && <div style={{ fontSize: 14, color: C.dangerText, marginTop: 8 }}>{error}</div>}
    </Sheet>
  );
}

// ── Week day strip ────────────────────────────────────────────────────────────
// One button per calendar day; a dot per workout shows how many that day has.
function DayStrip({ days, selectedDate, completed, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))`, gap: 6 }}>
      {days.map(d => {
        const selected = d.date === selectedDate;
        const rest = d.training.length === 0;
        const today = isToday(d.date);
        const multi = d.training.length > 1;
        const label = rest ? 'descanso'
          : `${plural(d.training.length)}, ${d.training.map(s => s.title).join(' y ')}`;
        return (
          <button
            key={d.date}
            onClick={() => onSelect(d.date)}
            aria-label={`${d.dayName} ${formatDateShort(d.date)}: ${label}`}
            aria-pressed={selected}
            style={{
              position: 'relative', height: 74, borderRadius: 20, padding: 0,
              border: selected ? 'none' : rest ? `1px dashed ${C.glassBorder}` : `1px solid ${today ? C.primary : C.glassBorder}`,
              background: selected ? 'linear-gradient(180deg, #FF5E7E, #FFB547)' : rest ? 'transparent' : C.glass,
              color: selected ? C.onPrimary : C.textMid,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            {multi && (
              <span aria-hidden="true" style={{ position: 'absolute', top: -9, right: -7, minWidth: 20, height: 18, padding: '0 4px', borderRadius: 999, background: selected ? C.onPrimary : C.primary, color: selected ? '#FFF5F2' : C.onPrimary, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', zIndex: 1 }}>
                ×{d.training.length}
              </span>
            )}
            <span style={{ fontSize: 12, fontWeight: selected ? 700 : 500 }}>{d.dayName}</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: selected ? C.onPrimary : C.text }}>{dayNum(d.date)}</span>
            <span style={{ display: 'flex', gap: 3, height: 8 }}>
              {d.training.slice(0, 3).map(s => {
                const color = sessionColor(s);
                const done = !!completed[s.id];
                return (
                  <span key={s.id} style={{
                    width: 8, height: 8, borderRadius: '50%', boxSizing: 'border-box',
                    background: done ? (selected ? C.onPrimary : color) : 'transparent',
                    border: `2px solid ${selected ? C.onPrimary : color}`,
                  }} />
                );
              })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onImport }) {
  return (
    <GlassCard radius={30} padding={26} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, marginTop: 20 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.primary + '26', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="run" size={32} color={C.primaryText} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: display }}>Sin plan activo</div>
      <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.6 }}>
        Importa un plan generado por Claude para empezar a entrenar. El prompt lo tienes en <strong style={{ color: C.text }}>Ajustes</strong>.
      </div>
      <Button icon="download" onClick={onImport} style={{ marginTop: 6 }}>Importar plan</Button>
    </GlassCard>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TrainingScreen() {
  const [plan, setPlanState] = useState(() => getPlan());
  const [completed, setCompleted] = useState(() => getCompleted());
  const [comments, setComments] = useState(() => getComments());
  const [showImport, setShowImport] = useState(false);
  const [weekIdx, setWeekIdx] = useState(() => findCurrentWeekIdx(getPlan()));
  const [selectedDate, setSelectedDate] = useState(() => defaultDate(getPlan()?.weeks?.[findCurrentWeekIdx(getPlan())]));
  const [editSession, setEditSession] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [toast, setToast] = useState('');
  const chipsRef = useRef(null);

  const week = plan?.weeks?.[weekIdx] || null;
  const days = groupByDay(week?.sessions);
  const selectedDay = days.find(d => d.date === selectedDate) || null;

  // Folded state is per day: switching days folds everything again.
  useEffect(() => { setExpanded({}); }, [selectedDate, weekIdx]);
  const toggleExpanded = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // Keep the selected week chip in view.
  useEffect(() => {
    const el = chipsRef.current?.children?.[weekIdx];
    el?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
  }, [weekIdx, plan]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const selectWeek = (i) => {
    setWeekIdx(i);
    setSelectedDate(defaultDate(plan.weeks[i]));
  };

  const handleToggle = (sessionId) => {
    setCompleted(toggleCompleted(sessionId));
  };

  const handleImport = (newPlan) => {
    replacePlan(newPlan);
    setPlanState(newPlan);
    setCompleted({});
    setComments({});
    setShowImport(false);
    const idx = findCurrentWeekIdx(newPlan);
    setWeekIdx(idx);
    setSelectedDate(defaultDate(newPlan.weeks[idx]));
  };

  const handleSaveEdit = (updates) => {
    const updated = updateSessionInPlan(plan, editSession.id, updates);
    setPlan(updated);
    setPlanState(updated);
    setEditSession(null);
  };

  const handleSaveComment = (sessionId, text) => {
    setComments(setComment(sessionId, text));
  };

  const handleExportPlan = () => {
    if (!plan) return;
    const json = JSON.stringify(plan, null, 2);
    // Try clipboard first, fallback to download
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).then(() => showToast('✓ Plan copiado al portapapeles')).catch(() => downloadPlan(json));
    } else {
      downloadPlan(json);
    }
  };

  const downloadPlan = (json) => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${plan.id || 'plan'}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast('✓ Plan descargado');
  };

  const active = week ? week.sessions.filter(s => s.type !== 'rest') : [];
  const doneCount = active.filter(s => completed[s.id]).length;
  const others = week ? week.sessions.filter(s => s.type !== 'rest' && dayKey(s) !== selectedDate) : [];
  const multi = selectedDay?.training.length > 1;

  return (
    <Screen>
      <ScreenHeader
        title="Entrenos"
        subtitle={plan ? `${plan.name} · semana ${weekIdx + 1} de ${plan.weeks.length}` : 'Sin plan activo'}
        right={<>
          {plan && <IconButton icon="upload" label="Exportar plan" onClick={handleExportPlan} />}
          <IconButton icon="download" label="Importar plan" onClick={() => setShowImport(true)} />
        </>}
      />

      {!plan ? (
        <EmptyState onImport={() => setShowImport(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div ref={chipsRef} className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -20px', padding: '2px 20px' }}>
            {plan.weeks.map((w, i) => (
              <Chip key={w.id || i} active={i === weekIdx} onClick={() => selectWeek(i)}>
                Sem {w.weekNumber || i + 1}{w.isRecovery ? ' · Recup.' : ''}
              </Chip>
            ))}
          </div>

          {week && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px' }}>
                <div style={{ fontSize: 14, color: C.textMid }}>
                  {week.sessions[0]?.date && formatDateShort(week.sessions[0].date)} – {week.sessions[week.sessions.length - 1]?.date && formatDateShort(week.sessions[week.sessions.length - 1].date)}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>
                  {doneCount}/{active.length} hechos{week.totalKm > 0 ? ` · ${week.totalKm} km` : ''}
                </div>
              </div>

              <DayStrip days={days} selectedDate={selectedDate} completed={completed} onSelect={setSelectedDate} />

              {multi && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                  <span style={{ fontFamily: display, fontSize: 18, fontWeight: 800 }}>
                    {isToday(selectedDay.date) ? 'Hoy' : `${selectedDay.dayName} ${dayNum(selectedDay.date)}`}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.onPrimary, background: C.primary, borderRadius: 999, padding: '4px 10px' }}>
                    {plural(selectedDay.training.length)}
                  </span>
                  <span style={{ fontSize: 13, color: C.textMid, marginLeft: 'auto' }}>Toca para ver el detalle</span>
                </div>
              )}

              {selectedDay && (selectedDay.training.length ? selectedDay.training : selectedDay.sessions.slice(0, 1)).map(s => multi && !expanded[s.id] ? (
                <SessionRow
                  key={s.id}
                  session={s}
                  completed={!!completed[s.id]}
                  onExpand={() => toggleExpanded(s.id)}
                  onToggle={() => handleToggle(s.id)}
                />
              ) : (
                <SessionCard
                  onCollapse={multi ? () => toggleExpanded(s.id) : undefined}
                  key={s.id}
                  session={s}
                  completed={!!completed[s.id]}
                  onToggle={() => handleToggle(s.id)}
                  onEdit={() => setEditSession(s)}
                  comment={comments[s.id] || ''}
                  onSaveComment={handleSaveComment}
                />
              ))}

              {others.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Label style={{ paddingLeft: 4 }}>Resto de la semana</Label>
                  {others.map(s => {
                    const color = sessionColor(s);
                    const done = !!completed[s.id];
                    return (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 999, background: C.glass, border: `1px solid ${C.glassBorder}`, padding: '0 8px 0 10px', minHeight: 62 }}>
                        <button onClick={() => { setSelectedDate(dayKey(s)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: '8px 0', textAlign: 'left', color: C.text }}>
                          <div style={{ width: 42, height: 42, borderRadius: '50%', background: color + '2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name={KIND_ICON[sessionKind(s)]} size={20} color={color} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: C.textMid }}>
                              {s.dayName} {dayNum(s.date)} · {KIND_LABEL[sessionKind(s)]}{comments[s.id] ? ' · con nota' : ''}
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleToggle(s.id)}
                          aria-label={done ? `Desmarcar ${s.title}` : `Marcar ${s.title} como hecho`}
                          aria-pressed={done}
                          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >
                          <span style={{ width: 30, height: 30, borderRadius: '50%', boxSizing: 'border-box', border: done ? 'none' : `2px solid ${C.glassBorder}`, background: done ? C.success : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {done && <Icon name="check" size={15} color={C.mode === 'light' ? '#FFFFFF' : '#0B2E2A'} />}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {editSession && editSession.type !== 'gym' && editSession.type !== 'rest' && <EditRunSheet session={editSession} onSave={handleSaveEdit} onClose={() => setEditSession(null)} />}
      {editSession?.type === 'gym' && <EditGymSheet session={editSession} onSave={handleSaveEdit} onClose={() => setEditSession(null)} />}
      {showImport && <ImportSheet onImport={handleImport} onClose={() => setShowImport(false)} />}
      {toast && <Toast>{toast}</Toast>}

      <AiChat mode="training" context={{ planName: plan?.name, week: week?.label }} />
    </Screen>
  );
}
