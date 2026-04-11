import { useState, useMemo } from 'react';
import { C, mono, sans, display } from '../utils/design.js';
import { getPlan, setPlan, getCompleted, toggleCompleted, updateSessionInPlan } from '../utils/storage.js';
import { isPast, isToday, formatDateShort, getMonthLabel, getMonthShort, todayStr } from '../utils/dateUtils.js';
import Icon from './Icon.jsx';
import AiChat from './AiChat.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────
const effortColor = {
  'Muy fácil': '#6EE7B7', 'Fácil': C.green, 'Moderado': C.amber,
  'Exigente': '#F97316', 'Intenso': C.red,
};

function groupByMonth(plan) {
  if (!plan?.weeks?.length) return { keys: [], map: {} };
  const map = {};
  plan.weeks.forEach(week => {
    const firstDate = week.sessions?.find(s => s.date)?.date;
    if (!firstDate) return;
    const mk = firstDate.slice(0, 7);
    if (!map[mk]) map[mk] = [];
    map[mk].push(week);
  });
  const keys = Object.keys(map).sort();
  return { keys, map };
}

// ── Run Detail Modal ──────────────────────────────────────────────────────────
function RunModal({ session, completed, onToggle, onEdit, onClose }) {
  const past = isPast(session.date);
  const today = isToday(session.date);
  const ec = effortColor[session.effort] || C.textMid;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bg, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', paddingBottom: 32, border: `1px solid ${C.border}`, borderBottom: 'none' }}>
        <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2 }} />
        </div>
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: session.color, letterSpacing: '0.12em', fontFamily: mono, marginBottom: 3, fontWeight: 600 }}>
                {session.dayName.toUpperCase()} · RUNNING {today && '· HOY'}{past && ' · PASADO'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: display, lineHeight: 1.2 }}>{session.title}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!past && <button onClick={onEdit} style={{ background: C.surfaceHigh, border: `1px solid ${C.borderHigh}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, color: C.textMid, fontFamily: mono, cursor: 'pointer' }}>Editar</button>}
              <button onClick={onClose} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="close" size={15} color={C.textMid} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {[
              { icon: 'map', label: 'Distancia', value: session.distance, c: session.color },
              { icon: 'pace', label: 'Ritmo', value: session.pace, c: C.text },
              { icon: 'clock', label: 'Esfuerzo', value: session.effort, c: ec },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: C.surfaceHigh, borderRadius: 12, padding: '10px 10px', border: `1px solid ${C.border}` }}>
                <Icon name={s.icon} size={13} color={s.c} />
                <div style={{ fontSize: 10, color: C.textLow, margin: '3px 0 2px', fontFamily: mono }}>{s.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.c, fontFamily: mono, lineHeight: 1.3 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {session.blocks?.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: C.textLow, letterSpacing: '0.1em', marginBottom: 10, fontFamily: mono }}>ESTRUCTURA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {session.blocks.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: C.surface, borderRadius: 11, borderLeft: `3px solid ${session.color}` }}>
                    <div style={{ minWidth: 60, fontSize: 11, color: session.color, fontFamily: mono, fontWeight: 600, paddingTop: 1 }}>{b.duration}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', marginBottom: 3 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.55 }}>{b.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {session.notes && (
            <div style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: C.amber, letterSpacing: '0.08em', marginBottom: 4, fontFamily: mono }}>NOTA</div>
              <div style={{ fontSize: 13, color: '#D1D5DB', lineHeight: 1.6 }}>{session.notes}</div>
            </div>
          )}

          <button onClick={onToggle} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer', background: completed ? C.greenDeep : session.color, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: display, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="check" size={18} color="#fff" />
            {completed ? '✓ Completada' : 'Marcar como completada'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Gym Detail Modal ──────────────────────────────────────────────────────────
function GymModal({ session, completed, onToggle, onEdit, onClose }) {
  const past = isPast(session.date);
  const today = isToday(session.date);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bg, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', paddingBottom: 32, border: `1px solid ${C.border}`, borderBottom: 'none' }}>
        <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2 }} />
        </div>
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: session.color, letterSpacing: '0.12em', fontFamily: mono, marginBottom: 3, fontWeight: 600 }}>
                {session.dayName.toUpperCase()} · GYM {today && '· HOY'}{past && ' · PASADO'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: display, lineHeight: 1.2 }}>{session.title}</div>
              {session.subtitle && <div style={{ fontSize: 13, color: C.textMid, marginTop: 4 }}>{session.subtitle}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!past && <button onClick={onEdit} style={{ background: C.surfaceHigh, border: `1px solid ${C.borderHigh}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, color: C.textMid, fontFamily: mono, cursor: 'pointer' }}>Editar</button>}
              <button onClick={onClose} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="close" size={15} color={C.textMid} />
              </button>
            </div>
          </div>

          {session.exercises?.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: C.textLow, letterSpacing: '0.1em', marginBottom: 10, fontFamily: mono }}>EJERCICIOS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {session.exercises.map((ex, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: C.surface, borderRadius: 11, borderLeft: `3px solid ${session.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: ex.notes ? 6 : 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{ex.name}</div>
                      <div style={{ fontSize: 11, color: session.color, fontFamily: mono, fontWeight: 600 }}>{ex.sets}×{ex.reps}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {ex.rest && <span style={{ fontSize: 11, color: C.textLow, fontFamily: mono }}>Desc: {ex.rest}</span>}
                      {ex.notes && <span style={{ fontSize: 11, color: C.textMid }}>{ex.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <button onClick={onToggle} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer', background: completed ? C.greenDeep : session.color, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: display, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="check" size={18} color="#fff" />
            {completed ? '✓ Completada' : 'Marcar como completada'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Run Modal ────────────────────────────────────────────────────────────
function EditRunModal({ session, onSave, onClose }) {
  const [title, setTitle] = useState(session.title || '');
  const [distance, setDistance] = useState(session.distance || '');
  const [pace, setPace] = useState(session.pace || '');
  const [effort, setEffort] = useState(session.effort || 'Fácil');
  const [notes, setNotes] = useState(session.notes || '');
  const [blocks, setBlocks] = useState(session.blocks ? JSON.parse(JSON.stringify(session.blocks)) : []);

  const addBlock = () => setBlocks(p => [...p, { name: '', duration: '', description: '' }]);
  const removeBlock = i => setBlocks(p => p.filter((_, idx) => idx !== i));
  const updateBlock = (i, field, val) => setBlocks(p => p.map((b, idx) => idx === i ? { ...b, [field]: val } : b));

  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', color: C.text, fontFamily: mono, fontSize: 12, outline: 'none', width: '100%' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bg, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', paddingBottom: 32, border: `1px solid ${C.border}`, borderBottom: 'none' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: display }}>Editar sesión running</div>
          <button onClick={onClose} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="close" size={15} color={C.textMid} />
          </button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 6 }}>TÍTULO</div>
            <input style={inp} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 6 }}>DISTANCIA</div>
              <input style={inp} value={distance} onChange={e => setDistance(e.target.value)} placeholder="ej: 5 km" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 6 }}>RITMO</div>
              <input style={inp} value={pace} onChange={e => setPace(e.target.value)} placeholder="ej: 6:30 /km" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 6 }}>ESFUERZO</div>
            <select style={{ ...inp, background: C.surface }} value={effort} onChange={e => setEffort(e.target.value)}>
              {['Muy fácil', 'Fácil', 'Moderado', 'Exigente', 'Intenso'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 6 }}>NOTA DEL ENTRENADOR</div>
            <textarea style={{ ...inp, resize: 'none' }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono }}>BLOQUES</div>
              <button onClick={addBlock} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 10, color: C.blue, fontFamily: mono, cursor: 'pointer' }}>+ Añadir</button>
            </div>
            {blocks.map((b, i) => (
              <div key={i} style={{ background: C.surface, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Nombre bloque" value={b.name} onChange={e => updateBlock(i, 'name', e.target.value)} />
                  <input style={{ ...inp, width: 80 }} placeholder="Duración" value={b.duration} onChange={e => updateBlock(i, 'duration', e.target.value)} />
                  <button onClick={() => removeBlock(i)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', padding: '0 4px' }}>✕</button>
                </div>
                <input style={inp} placeholder="Descripción" value={b.description} onChange={e => updateBlock(i, 'description', e.target.value)} />
              </div>
            ))}
          </div>
          <button onClick={() => onSave({ title, distance, pace, effort, notes, blocks })} style={{ width: '100%', padding: 13, background: session.color, color: '#fff', border: 'none', borderRadius: 10, fontFamily: display, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Gym Modal ────────────────────────────────────────────────────────────
function EditGymModal({ session, onSave, onClose }) {
  const [title, setTitle] = useState(session.title || '');
  const [subtitle, setSubtitle] = useState(session.subtitle || '');
  const [exercises, setExercises] = useState(session.exercises ? JSON.parse(JSON.stringify(session.exercises)) : []);

  const addEx = () => setExercises(p => [...p, { name: '', sets: 3, reps: '12', rest: '60s', notes: '' }]);
  const removeEx = i => setExercises(p => p.filter((_, idx) => idx !== i));
  const updateEx = (i, field, val) => setExercises(p => p.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', color: C.text, fontFamily: mono, fontSize: 12, outline: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bg, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', paddingBottom: 32, border: `1px solid ${C.border}`, borderBottom: 'none' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: display }}>Editar sesión gym</div>
          <button onClick={onClose} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="close" size={15} color={C.textMid} />
          </button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 6 }}>TÍTULO</div>
              <input style={{ ...inp, width: '100%' }} value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 6 }}>SUBTÍTULO</div>
              <input style={{ ...inp, width: '100%' }} value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="ej: 35 min" />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono }}>EJERCICIOS</div>
              <button onClick={addEx} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 10, color: C.blue, fontFamily: mono, cursor: 'pointer' }}>+ Añadir</button>
            </div>
            {exercises.map((ex, i) => (
              <div key={i} style={{ background: C.surface, borderRadius: 10, padding: '10px 12px', marginBottom: 8, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Nombre ejercicio" value={ex.name} onChange={e => updateEx(i, 'name', e.target.value)} />
                  <button onClick={() => removeEx(i)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 14, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input style={{ ...inp, width: 52 }} placeholder="Series" value={ex.sets} onChange={e => updateEx(i, 'sets', e.target.value)} />
                  <input style={{ ...inp, width: 64 }} placeholder="Reps" value={ex.reps} onChange={e => updateEx(i, 'reps', e.target.value)} />
                  <input style={{ ...inp, width: 64 }} placeholder="Desc." value={ex.rest} onChange={e => updateEx(i, 'rest', e.target.value)} />
                  <input style={{ ...inp, flex: 1 }} placeholder="Notas" value={ex.notes} onChange={e => updateEx(i, 'notes', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => onSave({ title, subtitle, exercises })} style={{ width: '100%', padding: 13, background: session.color, color: '#fff', border: 'none', borderRadius: 10, fontFamily: display, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Import Modal ──────────────────────────────────────────────────────────────
function ImportModal({ onImport, onClose }) {
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bg, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: `1px solid ${C.border}`, borderBottom: 'none' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.blue, fontFamily: mono, letterSpacing: '0.12em', marginBottom: 4 }}>IMPORTAR PLAN</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: display }}>Pega el JSON de tu plan</div>
          <div style={{ fontSize: 12, color: C.textMid, marginTop: 4, lineHeight: 1.5 }}>
            Genera el plan en Claude usando el prompt de Ajustes, pega el JSON aquí y cárgalo.
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError(''); }}
            placeholder={'{\n  "id": "mi-plan",\n  "name": "Mi plan de running",\n  "weeks": [...]\n}'}
            rows={12}
            style={{ width: '100%', background: C.surface, border: `1px solid ${error ? C.red : C.border}`, borderRadius: 10, padding: '12px', color: C.text, fontFamily: mono, fontSize: 11, outline: 'none', resize: 'none', lineHeight: 1.6 }}
          />
          {error && <div style={{ fontSize: 12, color: C.red, marginTop: 8, fontFamily: mono }}>{error}</div>}
        </div>
        <div style={{ padding: '12px 20px 28px', display: 'flex', gap: 8 }}>
          <button onClick={tryImport} disabled={!text.trim()} style={{ flex: 1, padding: 13, background: text.trim() ? C.blue : C.surfaceHigh, color: text.trim() ? '#fff' : C.textLow, border: 'none', borderRadius: 10, fontFamily: display, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Cargar plan
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: 13, background: C.surfaceHigh, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: mono, fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session Row ───────────────────────────────────────────────────────────────
function SessionRow({ session, completed, onToggle, onDetail }) {
  if (session.type === 'rest') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', opacity: 0.2 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="rest" size={14} color={C.textLow} />
        </div>
        <div style={{ fontSize: 12, color: C.textLow }}>{session.dayName} · Descanso</div>
      </div>
    );
  }

  const past = isPast(session.date);
  const today = isToday(session.date);
  const isRun = session.type === 'run';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: completed ? C.greenDark : C.surface, border: `1px solid ${completed ? C.greenBorder : C.border}`, transition: 'all 0.2s' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: session.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={isRun ? 'run' : 'gym'} size={15} color={session.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: session.color, fontFamily: mono, letterSpacing: '0.08em' }}>{session.dayName}</div>
          {today && <div style={{ fontSize: 9, background: C.blue + '33', color: C.blue, padding: '1px 6px', borderRadius: 4, fontFamily: mono, fontWeight: 700 }}>HOY</div>}
          {past && !completed && <Icon name="lock" size={11} color={C.textLow} />}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: completed ? '#6EE7B7' : C.text, lineHeight: 1.2, marginTop: 1 }}>{session.title}</div>
        {session.subtitle && <div style={{ fontSize: 11, color: C.textLow, marginTop: 1 }}>{session.subtitle}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onDetail(session)} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, color: C.textMid, cursor: 'pointer', fontFamily: mono }}>Ver →</button>
        <button onClick={() => onToggle(session.id)} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${completed ? C.greenDeep : C.border}`, background: completed ? C.greenDeep : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
          {completed && <Icon name="check" size={14} color="#fff" />}
        </button>
      </div>
    </div>
  );
}

// ── Week Card ─────────────────────────────────────────────────────────────────
function WeekCard({ week, completed, onToggle, isOpen, onToggleOpen, onEditSession }) {
  const [detailSession, setDetailSession] = useState(null);
  const [editSession, setEditSession] = useState(null);

  const active = week.sessions.filter(s => s.type !== 'rest');
  const done = active.filter(s => completed[s.id]).length;
  const pct = active.length ? done / active.length : 0;

  const handleEdit = (session) => {
    setDetailSession(null);
    setEditSession(session);
  };

  const handleSave = (updates) => {
    onEditSession(editSession.id, updates);
    setEditSession(null);
  };

  return (
    <div style={{ marginBottom: 10 }}>
      {detailSession && detailSession.type === 'run' && (
        <RunModal session={detailSession} completed={!!completed[detailSession.id]} onToggle={() => onToggle(detailSession.id)} onEdit={() => handleEdit(detailSession)} onClose={() => setDetailSession(null)} />
      )}
      {detailSession && detailSession.type === 'gym' && (
        <GymModal session={detailSession} completed={!!completed[detailSession.id]} onToggle={() => onToggle(detailSession.id)} onEdit={() => handleEdit(detailSession)} onClose={() => setDetailSession(null)} />
      )}
      {editSession && editSession.type === 'run' && (
        <EditRunModal session={editSession} onSave={handleSave} onClose={() => setEditSession(null)} />
      )}
      {editSession && editSession.type === 'gym' && (
        <EditGymModal session={editSession} onSave={handleSave} onClose={() => setEditSession(null)} />
      )}

      <button onClick={onToggleOpen} style={{ width: '100%', background: isOpen ? C.surfaceHigh : C.surface, border: `1px solid ${isOpen ? C.borderHigh : C.border}`, borderRadius: isOpen ? '14px 14px 0 0' : 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: C.textLow, letterSpacing: '0.12em', fontFamily: mono, marginBottom: 2 }}>
              {week.sessions[0]?.date && formatDateShort(week.sessions[0].date)} – {week.sessions[week.sessions.length - 1]?.date && formatDateShort(week.sessions[week.sessions.length - 1].date)}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: display, display: 'flex', alignItems: 'center', gap: 8 }}>
              {week.label}
              {week.isRecovery && <span style={{ fontSize: 9, background: '#1e3a5f', color: '#60A5FA', padding: '2px 7px', borderRadius: 5, fontFamily: mono }}>RECUPERACIÓN</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              {week.totalKm > 0 && <div style={{ fontSize: 17, fontWeight: 700, color: C.blue, fontFamily: display }}>{week.totalKm} km</div>}
              <div style={{ fontSize: 10, color: C.textLow }}>{done}/{active.length}</div>
            </div>
            <div style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
              <Icon name="chevron" size={16} color={C.textLow} />
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${pct * 100}%`, background: pct === 1 ? C.greenDeep : C.blue, borderRadius: 2, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {week.sessions.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 2, borderRadius: 1, background: s.type === 'rest' ? C.border : (completed[s.id] ? C.greenDeep : s.color + '55') }} />
          ))}
        </div>
      </button>

      {isOpen && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {week.sessions.map(s => (
            <SessionRow key={s.id} session={s} completed={!!completed[s.id]} onToggle={onToggle} onDetail={setDetailSession} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onImport }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: C.blue + '1a', border: `1px solid ${C.blue}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Icon name="run" size={32} color={C.blue} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: display, marginBottom: 8 }}>Sin plan activo</div>
      <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7, marginBottom: 32 }}>
        Importa un plan generado por Claude para empezar a entrenar.
        Ve a <strong style={{ color: C.text }}>Ajustes</strong> para obtener el prompt.
      </div>
      <button onClick={onImport} style={{ padding: '14px 28px', background: C.blue, color: '#fff', border: 'none', borderRadius: 12, fontFamily: display, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        Importar plan
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TrainingScreen({ onBack, onSettings }) {
  const [plan, setPlanState] = useState(() => getPlan());
  const [completed, setCompleted] = useState(() => getCompleted());
  const [showImport, setShowImport] = useState(false);
  const [monthIdx, setMonthIdx] = useState(0);
  const [openWeekId, setOpenWeekId] = useState(null);

  const { keys: monthKeys, map: weeksByMonth } = useMemo(() => groupByMonth(plan), [plan]);

  // Auto-select current month and week on load
  useMemo(() => {
    if (!monthKeys.length) return;
    const today = todayStr();
    const idx = monthKeys.findIndex(mk =>
      weeksByMonth[mk]?.some(w => w.sessions?.some(s => s.date >= today))
    );
    const targetIdx = idx >= 0 ? idx : monthKeys.length - 1;
    setMonthIdx(targetIdx);

    const mk = monthKeys[targetIdx];
    const currentWeek = weeksByMonth[mk]?.find(w => w.sessions?.some(s => s.date >= today));
    if (currentWeek) setOpenWeekId(currentWeek.id);
    else if (weeksByMonth[mk]?.length) setOpenWeekId(weeksByMonth[mk][weeksByMonth[mk].length - 1].id);
  }, [monthKeys.join(',')]);

  const handleToggle = (sessionId) => {
    setCompleted(toggleCompleted(sessionId));
  };

  const handleImport = (newPlan) => {
    setPlan(newPlan);
    setPlanState(newPlan);
    setCompleted({});
    setShowImport(false);
  };

  const handleEditSession = (sessionId, updates) => {
    const updated = updateSessionInPlan(plan, sessionId, updates);
    setPlan(updated);
    setPlanState(updated);
  };

  const currentMonthKey = monthKeys[monthIdx];
  const currentWeeks = currentMonthKey ? (weeksByMonth[currentMonthKey] || []) : [];
  const allActive = currentWeeks.flatMap(w => w.sessions.filter(s => s.type !== 'rest'));
  const doneCount = allActive.filter(s => completed[s.id]).length;
  const totalKm = currentWeeks.reduce((a, w) => a + (w.totalKm || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: sans, maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', position: 'sticky', top: 0, background: C.bg, zIndex: 10, paddingBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="back" size={16} color={C.textMid} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.blue, letterSpacing: '0.15em', fontFamily: mono }}>PLAN DE ENTRENAMIENTO</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: display, lineHeight: 1.1 }}>{plan?.name || 'Mis Entrenos'}</div>
          </div>
          <button onClick={onSettings} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="settings" size={16} color={C.textMid} />
          </button>
        </div>

        {plan && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <button onClick={() => setMonthIdx(i => Math.max(0, i - 1))} disabled={monthIdx === 0} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: monthIdx === 0 ? 0.25 : 1, transform: 'rotate(180deg)' }}>
                <Icon name="chevron" size={15} color={C.textMid} />
              </button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: display }}>{currentMonthKey ? getMonthLabel(currentMonthKey) : ''}</div>
                <div style={{ fontSize: 11, color: C.textLow, marginTop: 1 }}>{doneCount}/{allActive.length} sesiones · {totalKm} km</div>
              </div>
              <button onClick={() => setMonthIdx(i => Math.min(monthKeys.length - 1, i + 1))} disabled={monthIdx === monthKeys.length - 1} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: monthIdx === monthKeys.length - 1 ? 0.25 : 1 }}>
                <Icon name="chevron" size={15} color={C.textMid} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 5, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
              {monthKeys.map((mk, i) => (
                <button key={mk} onClick={() => setMonthIdx(i)} style={{ padding: '5px 11px', borderRadius: 7, border: '1px solid', borderColor: i === monthIdx ? C.blue : C.border, background: i === monthIdx ? '#162040' : 'transparent', color: i === monthIdx ? '#60A5FA' : C.textLow, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: mono, flexShrink: 0 }}>
                  {getMonthShort(mk)}
                </button>
              ))}
            </div>
          </>
        )}
        <div style={{ height: 1, background: C.surface }} />
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px 100px' }}>
        {!plan ? (
          <EmptyState onImport={() => setShowImport(true)} />
        ) : (
          currentWeeks.map(week => (
            <WeekCard
              key={week.id}
              week={week}
              completed={completed}
              onToggle={handleToggle}
              isOpen={openWeekId === week.id}
              onToggleOpen={() => setOpenWeekId(p => p === week.id ? null : week.id)}
              onEditSession={handleEditSession}
            />
          ))
        )}
      </div>

      {/* Import button */}
      <button
        onClick={() => setShowImport(true)}
        style={{
          position: 'fixed', bottom: 88, left: 20, height: 44,
          background: C.surfaceHigh, border: `1px solid ${C.blue}66`,
          borderRadius: 22, display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 16px', cursor: 'pointer', zIndex: 50,
        }}
      >
        <Icon name="upload" size={16} color={C.blue} />
        <span style={{ fontSize: 12, color: C.blue, fontFamily: mono, fontWeight: 600 }}>Importar plan</span>
      </button>

      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}

      <AiChat mode="training" context={{ planName: plan?.name, currentMonth: currentMonthKey }} />
    </div>
  );
}
