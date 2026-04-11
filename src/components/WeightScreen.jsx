import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Dot } from 'recharts';
import { C, mono, sans, display } from '../utils/design.js';
import { getWeight, setWeight } from '../utils/storage.js';
import { formatDateShort, formatDateMini } from '../utils/dateUtils.js';
import Icon from './Icon.jsx';
import AiChat from './AiChat.jsx';

// ── Chart helpers ─────────────────────────────────────────────────────────────
function WeightDot({ cx, cy, payload }) {
  if (!payload) return null;
  const color = payload.type === 'official' ? C.lime : C.amber;
  return <Dot cx={cx} cy={cy} r={payload.type === 'official' ? 5 : 3} fill={color} stroke={C.bg} strokeWidth={2} />;
}

function WeightTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontFamily: mono, fontSize: 12 }}>
      <div style={{ color: C.textMid, marginBottom: 4 }}>{d.displayDate}</div>
      <div style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>{d.weight} kg</div>
      <div style={{ color: d.type === 'official' ? C.lime : C.amber, fontSize: 10, marginTop: 2 }}>
        {d.type === 'official' ? '● Oficial' : '◎ Control'}
      </div>
      {d.note && <div style={{ color: C.textLow, fontSize: 10, marginTop: 4, maxWidth: 160 }}>{d.note}</div>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WeightScreen({ onBack, onSettings }) {
  const [data, setData] = useState(() => getWeight());
  const [type, setType] = useState('official');
  const [weight, setWeightInput] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [goalInput, setGoalInput] = useState(() => String(getWeight().goalWeight || 85));
  const [modal, setModal] = useState(null);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  const persist = (newData) => { setData(newData); setWeight(newData); };

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
  const remaining = latest ? (latest.weight - data.goalWeight) : null;

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

  const yValues = sorted.map(e => e.weight);
  const yMin = yValues.length ? Math.floor(Math.min(...yValues, data.goalWeight) - 1) : data.goalWeight - 5;
  const yMax = yValues.length ? Math.ceil(Math.max(...yValues) + 1) : data.goalWeight + 10;

  const addEntry = () => {
    const w = parseFloat(weight);
    if (!weight || !date || isNaN(w) || w < 30 || w > 300) return;
    const newEntries = [
      ...(data.entries || []).filter(e => !(e.date === date && e.type === type)),
      { id: Date.now(), date, weight: w, type, note: note.trim() },
    ];
    persist({ ...data, entries: newEntries });
    setWeightInput('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const deleteEntry = (id) => {
    persist({ ...data, entries: data.entries.filter(e => e.id !== id) });
  };

  const handleGoalBlur = () => {
    const v = parseFloat(goalInput);
    if (!isNaN(v) && v > 20 && v < 300) persist({ ...data, goalWeight: v });
    else setGoalInput(String(data.goalWeight));
  };

  const aiContext = { goalWeight: data.goalWeight, currentWeight: latest?.weight, weeklyRate, recentEntries: sorted.slice(-5) };

  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: C.text, fontFamily: mono, fontSize: 13, outline: 'none', width: '100%' };

  const stats = [
    { label: 'Peso actual', value: latest ? `${latest.weight} kg` : '—', sub: latest ? formatDateShort(latest.date) : 'sin datos', accent: false },
    { label: 'Por perder', value: remaining !== null ? `${Math.max(0, remaining).toFixed(1)} kg` : '—', sub: `hasta ${data.goalWeight} kg`, accent: remaining !== null && remaining < 10 },
    { label: 'Ritmo semanal', value: weeklyRate ? `-${weeklyRate} kg` : '—', sub: 'últimas 2 oficiales', accent: !!weeklyRate },
    { label: 'Semanas restantes', value: weeksToGoal ? `~${weeksToGoal}` : '—', sub: 'a ritmo actual', accent: false },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: sans, maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 12px', position: 'sticky', top: 0, background: C.bg, zIndex: 10, borderBottom: `1px solid ${C.surface}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="back" size={16} color={C.textMid} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.lime, letterSpacing: '0.15em', fontFamily: mono }}>CONTROL DE PESO</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: display, lineHeight: 1.1 }}>Weight Journey</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.lime, fontFamily: display, lineHeight: 1 }}>
              {totalLost > 0 ? `-${totalLost.toFixed(1)}` : '—'} <span style={{ fontSize: 13, color: C.textLow, fontWeight: 400 }}>kg</span>
            </div>
            <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono }}>perdidos</div>
          </div>
          <button onClick={onSettings} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="settings" size={16} color={C.textMid} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>
        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.accent ? C.lime : C.text, fontFamily: display, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.textLow, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Goal */}
        <div style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="target" size={16} color={C.lime} />
          <span style={{ fontSize: 13, color: C.textMid, fontFamily: mono }}>Meta:</span>
          <input
            type="number"
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            onBlur={handleGoalBlur}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
            style={{ background: 'transparent', border: 'none', borderBottom: `1px dashed ${C.borderHigh}`, color: C.lime, fontFamily: mono, fontSize: 14, width: 50, outline: 'none', textAlign: 'center', padding: '0 2px' }}
          />
          <span style={{ fontSize: 13, color: C.textMid, fontFamily: mono }}>kg</span>
          {first && <span style={{ fontSize: 11, color: C.textLow, fontFamily: mono, marginLeft: 'auto' }}>Inicio: {first.weight} kg</span>}
        </div>

        {/* Chart */}
        <div style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 8px 12px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, letterSpacing: '0.1em', marginBottom: 10, paddingLeft: 8 }}>EVOLUCIÓN DEL PESO</div>
          {chartData.length === 0 ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLow, fontSize: 12, fontFamily: mono }}>
              Añade tu primer peso para ver la gráfica
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.lime} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={C.lime} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="displayDate" tick={{ fill: C.textLow, fontSize: 9, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <YAxis domain={[yMin, yMax]} tick={{ fill: C.textLow, fontSize: 9, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<WeightTooltip />} />
                <ReferenceLine y={data.goalWeight} stroke={C.lime} strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: `Meta ${data.goalWeight}`, fill: C.lime, fontSize: 9, fontFamily: 'DM Mono' }} />
                <Area type="monotone" dataKey="weight" stroke={C.lime} strokeWidth={2} fill="url(#wgrad)" dot={<WeightDot />} activeDot={{ r: 6, fill: C.lime, stroke: C.bg, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', gap: 16, paddingLeft: 12, marginTop: 8 }}>
            {[{ color: C.lime, label: 'Oficial (lunes)' }, { color: C.amber, label: 'Control' }].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.textLow, fontFamily: mono }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color }} /> {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Add + History */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Add */}
          <div style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 14px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: display, marginBottom: 12 }}>Registrar</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[{ id: 'official', label: 'Oficial' }, { id: 'check', label: 'Control' }].map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{ flex: 1, padding: '7px 6px', borderRadius: 8, border: `1px solid ${type === t.id ? (t.id === 'official' ? C.lime : C.amber) : C.border}`, background: type === t.id ? (t.id === 'official' ? 'rgba(200,240,96,0.1)' : 'rgba(245,158,11,0.1)') : 'transparent', color: type === t.id ? (t.id === 'official' ? C.lime : C.amber) : C.textLow, fontFamily: mono, fontSize: 10, cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>
            <input type="number" placeholder="Peso (kg)" value={weight} onChange={e => setWeightInput(e.target.value)} step="0.1" min="30" max="300" onKeyDown={e => e.key === 'Enter' && addEntry()} style={{ ...inp, marginBottom: 7 }} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, marginBottom: 7, fontSize: 12 }} />
            <textarea placeholder="Nota..." value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ ...inp, resize: 'none', marginBottom: 8, fontFamily: sans, fontSize: 12 }} />
            <button onClick={addEntry} style={{ width: '100%', padding: '10px', background: C.lime, color: '#0e0e11', border: 'none', borderRadius: 8, fontFamily: mono, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>GUARDAR</button>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={() => { setCopied(false); setModal('export'); }} style={{ flex: 1, padding: '7px 6px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, color: C.lime, fontFamily: mono, fontSize: 9, cursor: 'pointer', letterSpacing: '0.04em' }}>↓ EXPORTAR</button>
              <button onClick={() => setModal('import')} style={{ flex: 1, padding: '7px 6px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, color: C.amber, fontFamily: mono, fontSize: 9, cursor: 'pointer', letterSpacing: '0.04em' }}>↑ IMPORTAR</button>
            </div>
          </div>

          {/* History */}
          <div style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 14px', overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: display, marginBottom: 12 }}>Historial</div>
            {sorted.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.textLow, fontFamily: mono, fontSize: 11, padding: '24px 0', lineHeight: 1.7 }}>Sin registros.<br />Añade tu primer peso.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 300, overflowY: 'auto' }}>
                {[...sorted].reverse().map((e, i, arr) => {
                  const prev = arr[i + 1];
                  const delta = prev ? (e.weight - prev.weight).toFixed(1) : null;
                  return (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 8px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}` }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.type === 'official' ? C.lime : C.amber, flexShrink: 0 }} />
                      <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, flexShrink: 0, width: 56 }}>{formatDateMini(e.date)}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: e.type === 'official' ? C.lime : C.amber, fontFamily: mono, flexShrink: 0 }}>{e.weight}</div>
                      {delta !== null && <div style={{ fontSize: 10, fontFamily: mono, color: parseFloat(delta) > 0 ? C.red : C.lime, flexShrink: 0 }}>{parseFloat(delta) > 0 ? `+${delta}` : delta}</div>}
                      <button onClick={() => deleteEntry(e.id)} style={{ background: 'none', border: 'none', color: C.textLow, cursor: 'pointer', fontSize: 11, padding: '2px 3px', marginLeft: 'auto', flexShrink: 0 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export modal */}
      {modal === 'export' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 18, width: '100%', maxWidth: 480, padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: display, marginBottom: 8 }}>Exportar pesos</div>
            <div style={{ fontSize: 12, color: C.textMid, fontFamily: mono, marginBottom: 12, lineHeight: 1.6 }}>Copia este JSON y guárdalo. Úsalo para restaurar desde Ajustes.</div>
            <textarea readOnly value={JSON.stringify(data.entries, null, 2)} rows={8} onClick={e => e.target.select()} style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, color: C.lime, fontFamily: mono, fontSize: 11, outline: 'none', resize: 'none' }} />
            {copied && <div style={{ color: C.lime, fontFamily: mono, fontSize: 11, marginTop: 6 }}>✓ Copiado</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(data.entries, null, 2)).then(() => setCopied(true)).catch(() => {}); }} style={{ flex: 1, padding: 11, background: C.lime, color: '#0e0e11', border: 'none', borderRadius: 8, fontFamily: mono, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Copiar</button>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 11, background: C.surfaceHigh, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: mono, fontSize: 12, cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {modal === 'import' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 18, width: '100%', maxWidth: 480, padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: display, marginBottom: 8 }}>Importar pesos</div>
            <div style={{ fontSize: 12, color: C.textMid, fontFamily: mono, marginBottom: 12, lineHeight: 1.6 }}>Pega el JSON exportado. Reemplazará los datos actuales.</div>
            <textarea placeholder='Pega aquí el JSON de pesos...' value={importText} onChange={e => setImportText(e.target.value)} rows={8} style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, color: C.text, fontFamily: mono, fontSize: 11, outline: 'none', resize: 'none' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => { try { const p = JSON.parse(importText); if (Array.isArray(p)) { const nd = { ...data, entries: p }; persist(nd); setModal(null); setImportText(''); } else alert('Formato inválido.'); } catch { alert('JSON inválido.'); } }} style={{ flex: 1, padding: 11, background: C.lime, color: '#0e0e11', border: 'none', borderRadius: 8, fontFamily: mono, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cargar</button>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 11, background: C.surfaceHigh, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: mono, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <AiChat mode="weight" context={aiContext} />
    </div>
  );
}
