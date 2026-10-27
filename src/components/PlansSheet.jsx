import { useEffect, useState } from 'react';
import { C, display, sessionKind, sessionColor, KIND_LABEL, KIND_ICON } from '../utils/design.js';
import { listPlanHistory, getPlanHistoryItem, deletePlanHistory, shiftPlan, alignedStart } from '../utils/storage.js';
import { formatDateShort, todayStr } from '../utils/dateUtils.js';
import Icon from './Icon.jsx';
import { Sheet, Button, GlassCard, Label, Ring, Field, inputStyle } from './ui.jsx';

const range = (a, b) => (a && b ? `${formatDateShort(a)} – ${formatDateShort(b)}` : '');
const longDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

// Read-only view of an archived plan with what was done and the notes.
function PlanDetail({ item }) {
  const weeks = item.data?.weeks || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {weeks.map((w, wi) => (
        <div key={w.id || wi}>
          <Label style={{ marginBottom: 8, paddingLeft: 4 }}>{w.label || `Semana ${wi + 1}`}{w.isRecovery ? ' · recuperación' : ''}</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(w.sessions || []).filter(s => s.type !== 'rest').map(s => {
              const done = !!item.completed?.[s.id];
              const note = item.comments?.[s.id];
              const color = sessionColor(s);
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 18, background: C.inset }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: color + '2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={KIND_ICON[sessionKind(s)]} size={17} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: C.textMid }}>{s.dayName} {s.date && formatDateShort(s.date)} · {KIND_LABEL[sessionKind(s)]}</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{s.title}</div>
                    {note && <div style={{ fontSize: 14, color: C.textMid, marginTop: 3, fontStyle: 'italic' }}>“{note}”</div>}
                  </div>
                  <span aria-label={done ? 'Hecho' : 'No hecho'} style={{ width: 26, height: 26, borderRadius: '50%', boxSizing: 'border-box', flexShrink: 0, border: done ? 'none' : `2px solid ${C.glassBorder}`, background: done ? C.success : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done && <Icon name="check" size={14} color={C.mode === 'light' ? '#FFFFFF' : '#0B2E2A'} />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PlansSheet({ hasActivePlan, onClose, onReuse, onEnd }) {
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [open, setOpen] = useState(null);          // { mode: 'view' | 'reuse', item }
  const [loadingItem, setLoadingItem] = useState('');
  const [fromDate, setFromDate] = useState(todayStr());
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    listPlanHistory().then(({ data, error, missingTable }) => {
      setItems(data);
      if (missingTable) setLoadError('Falta crear la tabla de planes guardados en Supabase. Ejecuta el SQL de supabase/migrations/20261027_plan_history.sql.');
      else if (error) setLoadError('No se han podido cargar tus planes guardados. Revisa tu conexión.');
    });
  }, []);

  const openItem = async (summary, mode) => {
    setLoadingItem(summary.id);
    const { data, error } = await getPlanHistoryItem(summary.id);
    setLoadingItem('');
    if (error || !data) { setLoadError('No se ha podido abrir ese plan. Inténtalo de nuevo.'); return; }
    setFromDate(todayStr());
    setOpen({ mode, item: data });
  };

  const removeItem = (id) => {
    deletePlanHistory(id);
    setItems(list => list.filter(i => i.id !== id));
    setConfirmDelete(null);
  };

  if (open?.mode === 'view') {
    return (
      <Sheet eyebrow={{ text: 'Plan guardado', color: C.primaryText }} title={open.item.name || 'Plan sin nombre'} onClose={() => setOpen(null)}
        footer={<Button onClick={() => setOpen({ ...open, mode: 'reuse' })} icon="refresh">Volver a usar este plan</Button>}>
        <div style={{ fontSize: 14, color: C.textMid, marginBottom: 12 }}>{range(open.item.start_date, open.item.end_date)}</div>
        <PlanDetail item={open.item} />
      </Sheet>
    );
  }

  if (open?.mode === 'reuse') {
    const start = alignedStart(open.item.data, fromDate);
    return (
      <Sheet eyebrow={{ text: 'Volver a usar', color: C.primaryText }} title={open.item.name || 'Plan sin nombre'} onClose={() => setOpen(null)}
        footer={<Button onClick={() => onReuse(shiftPlan(open.item.data, fromDate))} disabled={!fromDate}>Empezar este plan</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="¿Desde cuándo?">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle()} />
          </Field>
          {start && (
            <div style={{ fontSize: 15, lineHeight: 1.55 }}>
              Empezará el <strong>{longDate(start)}</strong>. Las fechas se mueven manteniendo los días de la semana del plan original y el progreso empieza de cero.
            </div>
          )}
          {hasActivePlan && (
            <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.5 }}>
              Tu plan actual se guardará en «Mis planes» con su progreso antes de cambiarlo.
            </div>
          )}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet eyebrow={{ text: 'Historial', color: C.primaryText }} title="Mis planes" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hasActivePlan && (
          confirmEnd ? (
            <GlassCard radius={22} padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 15, lineHeight: 1.5 }}>¿Terminar el plan actual? Se guardará aquí con su progreso y notas, y te quedarás sin plan activo.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={onEnd}>Sí, terminar</Button>
                <Button variant="glass" onClick={() => setConfirmEnd(false)}>Cancelar</Button>
              </div>
            </GlassCard>
          ) : (
            <Button variant="glass" icon="check" onClick={() => setConfirmEnd(true)}>Terminar plan actual y guardarlo</Button>
          )
        )}

        {loadError && <div role="status" style={{ fontSize: 14, color: C.dangerText, lineHeight: 1.5 }}>{loadError}</div>}
        {items === null && <div style={{ fontSize: 15, color: C.textMid, padding: '12px 4px' }}>Cargando...</div>}
        {items?.length === 0 && !loadError && (
          <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.55, padding: '8px 4px' }}>
            Aún no tienes planes guardados. Cuando importes un plan nuevo o termines el actual, se guardará aquí con su progreso.
          </div>
        )}

        {items?.map(it => {
          const pct = it.total_sessions ? it.done_sessions / it.total_sessions : 0;
          return (
            <GlassCard key={it.id} radius={24} padding={14} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Ring size={52} stroke={6} value={pct} label={`${Math.round(pct * 100)}% hecho`}>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>{Math.round(pct * 100)}%</span>
                </Ring>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: display, fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{it.name || 'Plan sin nombre'}</div>
                  <div style={{ fontSize: 13, color: C.textMid, marginTop: 2 }}>
                    {range(it.start_date, it.end_date)} · {it.weeks} sem · {it.done_sessions}/{it.total_sessions} entrenos
                  </div>
                </div>
              </div>
              {confirmDelete === it.id ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="danger" onClick={() => removeItem(it.id)} style={{ height: 44, fontSize: 14 }}>Borrar</Button>
                  <Button variant="glass" onClick={() => setConfirmDelete(null)} style={{ height: 44, fontSize: 14 }}>Cancelar</Button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="glass" onClick={() => openItem(it, 'view')} disabled={!!loadingItem} style={{ height: 44, fontSize: 14 }}>{loadingItem === it.id ? '...' : 'Ver'}</Button>
                  <Button onClick={() => openItem(it, 'reuse')} disabled={!!loadingItem} style={{ height: 44, fontSize: 14 }}>Reutilizar</Button>
                  <button onClick={() => setConfirmDelete(it.id)} aria-label={`Borrar ${it.name || 'plan'}`} style={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', border: `1px solid ${C.glassBorder}`, background: C.glass, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="trash" size={17} color={C.dangerText} />
                  </button>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </Sheet>
  );
}
