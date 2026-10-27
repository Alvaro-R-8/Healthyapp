import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Dot } from 'recharts';
import { C, GRADIENT, display, sans } from '../utils/design.js';
import { getWeight, addWeightEntry, deleteWeightEntry, setGoalWeight, replaceWeightEntries } from '../utils/storage.js';
import { formatDateShort, formatDateMini } from '../utils/dateUtils.js';
import Icon from './Icon.jsx';
import AiChat from './AiChat.jsx';
import { Screen, ScreenHeader, GlassCard, Label, Button, Segmented, Sheet, Field, Ring, inputStyle } from './ui.jsx';

const fmt = (n, d = 1) => Number(n).toFixed(d).replace('.', ',');

// ── Chart helpers ─────────────────────────────────────────────────────────────
function WeightDot({ cx, cy, payload }) {
  if (!payload) return null;
  const color = payload.type === 'official' ? C.primary : C.secondary;
  return <Dot cx={cx} cy={cy} r={payload.type === 'official' ? 5 : 3} fill={color} stroke={C.bgElevated} strokeWidth={2} />;
}

function WeightTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: C.bgElevated, border: `1px solid ${C.glassBorder}`, borderRadius: 14, padding: '10px 14px', fontFamily: sans, fontSize: 13, color: C.text }}>
      <div style={{ color: C.textMid, marginBottom: 4 }}>{d.displayDate}</div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(d.weight)} kg</div>
      <div style={{ color: d.type === 'official' ? C.primaryText : C.secondary, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
        {d.type === 'official' ? 'Oficial' : 'Control'}
      </div>
      {d.note && <div style={{ color: C.textMid, fontSize: 12, marginTop: 4, maxWidth: 180 }}>{d.note}</div>}
    </div>
  );
}

// Monday of the week a YYYY-MM-DD date falls in, as YYYY-MM-DD.
function weekStart(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function WeeklyBars({ weeks }) {
  const max = Math.max(...weeks.map(w => w.avg));
  const min = Math.min(...weeks.map(w => w.avg));
  const span = max - min || 1;
  return (
    <div role="img" aria-label={`Media semanal de peso: de ${fmt(weeks[0].avg)} a ${fmt(weeks[weeks.length - 1].avg)} kg`} style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`, gap: 10, alignItems: 'end', height: 128 }}>
      {weeks.map((w, i) => {
        const last = i === weeks.length - 1;
        const h = 30 + ((w.avg - min) / span) * 70;
        return (
          <div key={w.start} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: last ? 800 : 600, color: last ? C.text : C.textMid }}>{fmt(w.avg)}</div>
            <div style={{ width: '100%', maxWidth: 30, height: h, borderRadius: 10, background: last ? 'linear-gradient(180deg, #FF5E7E, #FFB547)' : C.primary + '30' }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WeightScreen() {
  const [data, setData] = useState(() => getWeight());
  const [type, setType] = useState('official');
  const [weight, setWeightInput] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [goalInput, setGoalInput] = useState(() => getWeight().goalWeight != null ? String(getWeight().goalWeight) : '');
  const [modal, setModal] = useState(null);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  const sorted = useMemo(() =>
    [...(data.entries || [])].sort((a, b) => a.date.localeCompare(b.date)),
    [data.entries]
  );

  const chartData = sorted.map(e => ({
    ...e,
    displayDate: formatDateShort(e.date),
  }));

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const totalLost = first && latest ? (first.weight - latest.weight) : 0;
  const hasGoal = data.goalWeight != null;
  const remaining = latest && hasGoal ? (latest.weight - data.goalWeight) : null;
  const progress = hasGoal && first && latest && first.weight > data.goalWeight
    ? (first.weight - latest.weight) / (first.weight - data.goalWeight) : 0;

  const weeklyRate = useMemo(() => {
    const officials = sorted.filter(e => e.type === 'official');
    if (officials.length < 2) return null;
    const last2 = officials.slice(-2);
    const days = (new Date(last2[1].date) - new Date(last2[0].date)) / 86400000;
    const diff = last2[0].weight - last2[1].weight;
    return days > 0 ? ((diff / days) * 7).toFixed(2) : null;
  }, [sorted]);

  const weeksToGoal = weeklyRate && parseFloat(weeklyRate) > 0 && remaining > 0
    ? Math.ceil(remaining / parseFloat(weeklyRate)) : null;

  const weeklyAvgs = useMemo(() => {
    const groups = {};
    sorted.forEach(e => { (groups[weekStart(e.date)] ||= []).push(e.weight); });
    return Object.keys(groups).sort().slice(-8).map(start => ({
      start, avg: groups[start].reduce((a, b) => a + b, 0) / groups[start].length,
    }));
  }, [sorted]);

  const yValues = sorted.map(e => e.weight);
  const goalValues = hasGoal ? [data.goalWeight] : [];
  const yMin = yValues.length ? Math.floor(Math.min(...yValues, ...goalValues) - 1) : (hasGoal ? data.goalWeight - 5 : 'auto');
  const yMax = yValues.length ? Math.ceil(Math.max(...yValues) + 1) : (hasGoal ? data.goalWeight + 10 : 'auto');

  const addEntry = () => {
    const w = parseFloat(String(weight).replace(',', '.'));
    if (!weight || !date || isNaN(w) || w < 30 || w > 300) return;
    setData(addWeightEntry({ date, weight: w, type, note }));
    setWeightInput('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setModal(null);
  };

  const deleteEntry = (id) => {
    setData(deleteWeightEntry(id));
  };

  const handleGoalBlur = () => {
    if (!goalInput.trim()) { setData(setGoalWeight(null)); return; }
    const v = parseFloat(goalInput.replace(',', '.'));
    if (!isNaN(v) && v > 20 && v < 300) setData(setGoalWeight(v));
    else setGoalInput(hasGoal ? String(data.goalWeight) : '');
  };

  const aiContext = { goalWeight: data.goalWeight, currentWeight: latest?.weight, weeklyRate, recentEntries: sorted.slice(-5) };

  const tickStyle = { fill: C.textMid, fontSize: 11, fontFamily: 'Inter, sans-serif' };
  const inp = inputStyle();

  return (
    <Screen>
      <ScreenHeader
        title="Peso"
        subtitle={hasGoal ? `Meta ${fmt(data.goalWeight)} kg${remaining > 0 ? ` · faltan ${fmt(remaining)} kg` : ''}` : 'Define tu meta para ver el progreso'}
        right={
          <button onClick={() => setModal('add')} aria-label="Registrar peso" style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <Icon name="plus" size={22} color={C.onPrimary} />
          </button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Ring + key numbers */}
        <GlassCard radius={32} padding={18} style={{ display: 'flex', alignItems: 'center', gap: 16, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <Ring size={156} stroke={15} value={progress} label={latest ? `${fmt(latest.weight)} kg${hasGoal ? `, ${Math.round(Math.max(0, Math.min(1, progress)) * 100)}% del camino a la meta` : ''}` : 'Sin registros'}>
            <span style={{ fontFamily: display, fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{latest ? fmt(latest.weight) : '—'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid, marginTop: 4 }}>{latest ? `kg · ${formatDateShort(latest.date)}` : 'sin datos'}</span>
          </Ring>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 12, color: C.textMid, display: 'block' }}>Meta (kg)</span>
              <input
                type="text"
                inputMode="decimal"
                value={goalInput}
                placeholder="Añadir"
                onChange={e => setGoalInput(e.target.value)}
                onBlur={handleGoalBlur}
                onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                style={{ width: 90, background: 'transparent', border: 'none', borderBottom: `2px dashed ${C.glassBorder}`, color: C.primaryText, fontFamily: sans, fontSize: 19, fontWeight: 800, outline: 'none', padding: '2px 0' }}
              />
            </label>
            <div>
              <div style={{ fontSize: 12, color: C.textMid }}>Por perder</div>
              <div style={{ fontSize: 19, fontWeight: 800 }}>{remaining !== null ? `${fmt(Math.max(0, remaining))} kg` : '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textMid }}>Llevas</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: totalLost > 0 ? C.success : C.text }}>{first && latest ? `${totalLost > 0 ? '−' : totalLost < 0 ? '+' : ''}${fmt(Math.abs(totalLost))} kg` : '—'}</div>
            </div>
          </div>
        </GlassCard>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <GlassCard radius={22} padding="12px 14px">
            <div style={{ fontSize: 13, color: C.textMid }}>Ritmo semanal</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2, color: weeklyRate && parseFloat(weeklyRate) > 0 ? C.success : C.text }}>{weeklyRate ? `−${fmt(weeklyRate, 2)} kg` : '—'}</div>
            <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>últimos 2 oficiales</div>
          </GlassCard>
          <GlassCard radius={22} padding="12px 14px">
            <div style={{ fontSize: 13, color: C.textMid }}>Semanas a la meta</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{weeksToGoal ? `~${weeksToGoal}` : '—'}</div>
            <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>a ritmo actual</div>
          </GlassCard>
        </div>

        {weeklyAvgs.length >= 2 && (
          <GlassCard radius={28} padding="16px 18px" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Media semanal</div>
              <div style={{ fontSize: 13, color: C.textMid }}>últimas {weeklyAvgs.length} semanas</div>
            </div>
            <WeeklyBars weeks={weeklyAvgs} />
          </GlassCard>
        )}

        <GlassCard radius={28} padding="16px 8px 12px">
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, paddingLeft: 10 }}>Evolución</div>
          {chartData.length === 0 ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMid, fontSize: 14 }}>
              Añade tu primer peso para ver la gráfica
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.primary} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={C.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                <XAxis dataKey="displayDate" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis domain={[yMin, yMax]} tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<WeightTooltip />} />
                {hasGoal && <ReferenceLine y={data.goalWeight} stroke={C.success} strokeDasharray="6 4" label={{ value: `Meta ${fmt(data.goalWeight)}`, fill: C.success, fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif', position: 'insideTopRight' }} />}
                <Area type="monotone" dataKey="weight" stroke={C.primary} strokeWidth={3} fill="url(#wgrad)" dot={<WeightDot />} activeDot={{ r: 6, fill: C.primary, stroke: C.bgElevated, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', gap: 16, paddingLeft: 12, marginTop: 8 }}>
            {[{ color: C.primary, label: 'Oficial (lunes)' }, { color: C.secondary, label: 'Control' }].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textMid }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} /> {l.label}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <Label>Historial</Label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { setCopied(false); setModal('export'); }} style={{ height: 34, padding: '0 12px', borderRadius: 999, border: 'none', background: C.glassStrong, color: C.text, fontSize: 13, fontWeight: 700 }}>Exportar</button>
              <button onClick={() => setModal('import')} style={{ height: 34, padding: '0 12px', borderRadius: 999, border: 'none', background: C.glassStrong, color: C.text, fontSize: 13, fontWeight: 700 }}>Importar</button>
            </div>
          </div>
          {sorted.length === 0 ? (
            <GlassCard radius={22} padding={20} style={{ textAlign: 'center', color: C.textMid, fontSize: 14 }}>Sin registros. Pulsa + para añadir tu primer peso.</GlassCard>
          ) : (
            [...sorted].reverse().map((e, i, arr) => {
              const prev = arr[i + 1];
              const delta = prev ? e.weight - prev.weight : null;
              const official = e.type === 'official';
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '6px 6px 6px 16px', borderRadius: 999, background: C.glass, border: `1px solid ${C.glassBorder}` }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', boxSizing: 'border-box', background: official ? C.primary : 'transparent', border: official ? 'none' : `2px solid ${C.secondary}`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDateMini(e.date)} <span style={{ fontWeight: 500, color: C.textMid }}>· {official ? 'Oficial' : 'Control'}</span></div>
                    {e.note && <div style={{ fontSize: 13, color: C.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.note}</div>}
                  </div>
                  {delta !== null && <div style={{ fontSize: 13, fontWeight: 700, color: delta > 0 ? C.dangerText : C.success, flexShrink: 0 }}>{delta > 0 ? '+' : delta < 0 ? '−' : ''}{fmt(Math.abs(delta))}</div>}
                  <div style={{ fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{fmt(e.weight)} kg</div>
                  <button onClick={() => deleteEntry(e.id)} aria-label={`Borrar registro del ${formatDateMini(e.date)}`} style={{ width: 44, height: 44, borderRadius: '50%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="close" size={16} color={C.textLow} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {modal === 'add' && (
        <Sheet title="Registrar peso" onClose={() => setModal(null)} footer={<Button onClick={addEntry} disabled={!weight}>Guardar</Button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Segmented
              options={[{ value: 'official', label: 'Oficial' }, { value: 'control', label: 'Control' }]}
              value={type}
              onChange={setType}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <Field label="Peso (kg)" style={{ flex: 1 }}>
                <input type="text" inputMode="decimal" placeholder={latest ? fmt(latest.weight) : '80,0'} value={weight} onChange={e => setWeightInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEntry()} style={{ ...inp, fontSize: 20, fontWeight: 800 }} />
              </Field>
              <Field label="Fecha" style={{ flex: 1 }}>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
              </Field>
            </div>
            <Field label="Nota (opcional)">
              <textarea placeholder="Cómo te encuentras, contexto..." value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ ...inp, resize: 'none' }} />
            </Field>
          </div>
        </Sheet>
      )}

      {modal === 'export' && (
        <Sheet
          title="Exportar pesos"
          onClose={() => setModal(null)}
          footer={<Button icon="copy" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(data.entries, null, 2)).then(() => setCopied(true)).catch(() => {}); }}>{copied ? '✓ Copiado' : 'Copiar'}</Button>}
        >
          <div style={{ fontSize: 15, color: C.textMid, marginBottom: 12, lineHeight: 1.55 }}>Copia este JSON y guárdalo. Úsalo para restaurar desde Ajustes.</div>
          <textarea aria-label="JSON de pesos" readOnly value={JSON.stringify(data.entries, null, 2)} rows={8} onClick={e => e.target.select()} style={{ ...inp, fontSize: 12, fontFamily: 'ui-monospace, Menlo, monospace', resize: 'none' }} />
        </Sheet>
      )}

      {modal === 'import' && (
        <Sheet
          title="Importar pesos"
          onClose={() => setModal(null)}
          footer={<Button onClick={() => { try { const p = JSON.parse(importText); if (Array.isArray(p)) { setData(replaceWeightEntries(p)); setModal(null); setImportText(''); } else alert('Formato inválido.'); } catch { alert('JSON inválido.'); } }} disabled={!importText.trim()}>Cargar</Button>}
        >
          <div style={{ fontSize: 15, color: C.textMid, marginBottom: 12, lineHeight: 1.55 }}>Pega el JSON exportado. Reemplazará los datos actuales.</div>
          <textarea aria-label="JSON de pesos" placeholder="Pega aquí el JSON de pesos..." value={importText} onChange={e => setImportText(e.target.value)} rows={8} style={{ ...inp, fontSize: 12, fontFamily: 'ui-monospace, Menlo, monospace', resize: 'none' }} />
        </Sheet>
      )}

      <AiChat mode="weight" context={aiContext} />
    </Screen>
  );
}
