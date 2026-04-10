import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import {
  getInitialWeight, setInitialWeight as saveInitialWeight,
  getWeightEntries, addWeightEntry, deleteWeightEntry
} from '../utils/storage'

function today() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}`
}

function formatDateFull(d) {
  if (!d) return ''
  const date = new Date(d + 'T12:00:00')
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1f2b47] border border-white/10 rounded-xl px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 text-xs">{formatDateFull(d.date)}</p>
      <p className="text-white font-bold">{d.weight} kg</p>
      {d.official && <p className="text-xs text-blue-400">Oficial</p>}
    </div>
  )
}

function AddModal({ onSave, onClose, existingEntry }) {
  const [weight, setWeight] = useState(existingEntry?.weight?.toString() || '')
  const [date, setDate] = useState(existingEntry?.date || today())
  const [official, setOfficial] = useState(existingEntry?.official ?? false)

  const isMonday = useCallback((d) => new Date(d + 'T12:00:00').getDay() === 1, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleDateChange = (d) => {
    setDate(d)
    if (isMonday(d)) setOfficial(true)
  }

  const handleSave = () => {
    const w = parseFloat(weight)
    if (!w || w < 30 || w > 300) return
    onSave({ date, weight: w, official })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-md mx-auto bg-[#1a1a2e] rounded-t-3xl p-6 slide-up" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold text-white mb-4">{existingEntry ? 'Editar peso' : 'Registrar peso'}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={e => handleDateChange(e.target.value)}
              className="w-full bg-[#16213e] text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500/50 text-base"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Peso (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="Ej: 80.5"
              step="0.1"
              min="30"
              max="300"
              className="w-full bg-[#16213e] text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500/50 text-xl font-bold"
            />
          </div>

          <button
            onClick={() => setOfficial(o => !o)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
              official ? 'bg-blue-500/20 border-blue-500/40' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${official ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
              {official && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Peso oficial</p>
              <p className="text-xs text-gray-400">Pesaje del lunes (se usa para el seguimiento principal)</p>
            </div>
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-semibold">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!weight || parseFloat(weight) < 30}
            className="flex-1 py-3 rounded-xl bg-blue-500 disabled:opacity-50 text-white font-bold"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function SetupWeight({ onSave }) {
  const [weight, setWeight] = useState('')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="text-6xl mb-6">⚖️</div>
      <h1 className="text-2xl font-bold text-white mb-2 text-center">Control de Peso</h1>
      <p className="text-gray-400 text-sm text-center mb-8">Introduce tu peso inicial para comenzar el seguimiento</p>

      <div className="w-full bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 mb-6">
        <label className="block text-sm text-gray-400 mb-2">Peso inicial (kg)</label>
        <input
          type="number"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="Ej: 85.0"
          step="0.1"
          min="30"
          max="300"
          className="w-full bg-[#16213e] text-white rounded-xl px-4 py-4 border border-white/10 text-3xl font-bold text-center focus:outline-none focus:border-blue-500/50"
        />
        <p className="text-xs text-gray-500 mt-2 text-center">Este será tu punto de referencia</p>
      </div>

      <button
        onClick={() => { if (parseFloat(weight) >= 30) onSave(parseFloat(weight)) }}
        disabled={!weight || parseFloat(weight) < 30}
        className="w-full bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95"
      >
        Guardar Peso Inicial
      </button>
    </div>
  )
}

export default function WeightControl() {
  const [initialWeight, setInitialWeightState] = useState(getInitialWeight)
  const [entries, setEntries] = useState(getWeightEntries)
  const [showModal, setShowModal] = useState(false)
  const [editingInitial, setEditingInitial] = useState(false)
  const [newInitial, setNewInitial] = useState('')

  const officialEntries = entries.filter(e => e.official)
  const allEntries = entries
  const lastOfficial = officialEntries[officialEntries.length - 1]
  const currentWeight = entries[entries.length - 1]?.weight
  const diff = initialWeight && currentWeight ? (currentWeight - initialWeight) : null

  const chartData = entries.map(e => ({ ...e, date: e.date }))

  const handleSaveEntry = useCallback((entry) => {
    const updated = addWeightEntry(entry)
    setEntries([...updated])
  }, [])

  const handleDelete = useCallback((date, official) => {
    const updated = deleteWeightEntry(date, official)
    setEntries([...updated])
  }, [])

  const handleSaveInitial = useCallback((w) => {
    saveInitialWeight(w)
    setInitialWeightState(w)
    setEditingInitial(false)
  }, [])

  if (!initialWeight) return <SetupWeight onSave={(w) => { saveInitialWeight(w); setInitialWeightState(w) }} />

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white mb-4">Control de Peso</h1>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Inicial</p>
            {editingInitial ? (
              <input
                type="number"
                value={newInitial}
                onChange={e => setNewInitial(e.target.value)}
                onBlur={() => { if (parseFloat(newInitial) >= 30) handleSaveInitial(parseFloat(newInitial)); else setEditingInitial(false) }}
                onKeyDown={e => e.key === 'Enter' && handleSaveInitial(parseFloat(newInitial))}
                autoFocus
                className="w-full bg-transparent text-white font-bold text-lg text-center border-b border-blue-400 focus:outline-none"
                step="0.1"
              />
            ) : (
              <button onClick={() => { setNewInitial(initialWeight.toString()); setEditingInitial(true) }} className="w-full">
                <p className="text-lg font-bold text-white">{initialWeight}<span className="text-xs text-gray-400"> kg</span></p>
              </button>
            )}
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Actual</p>
            <p className="text-lg font-bold text-blue-400">{currentWeight ?? '—'}<span className="text-xs text-gray-400"> kg</span></p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Variación</p>
            {diff !== null ? (
              <p className={`text-lg font-bold ${diff < 0 ? 'text-green-400' : diff > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)}<span className="text-xs"> kg</span>
              </p>
            ) : (
              <p className="text-lg font-bold text-gray-400">—</p>
            )}
          </div>
        </div>

        {lastOfficial && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-400 font-semibold">Último pesaje oficial (lunes)</p>
            <div className="flex justify-between items-center mt-1">
              <p className="text-white font-bold">{lastOfficial.weight} kg</p>
              <p className="text-xs text-gray-400">{formatDateFull(lastOfficial.date)}</p>
              {initialWeight && (
                <p className={`text-sm font-bold ${lastOfficial.weight < initialWeight ? 'text-green-400' : 'text-red-400'}`}>
                  {lastOfficial.weight > initialWeight ? '+' : ''}{(lastOfficial.weight - initialWeight).toFixed(1)} kg
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-500 text-white font-bold py-3 rounded-2xl text-base transition-all active:scale-95 mb-2"
        >
          + Registrar peso
        </button>
      </div>

      {entries.length >= 2 && (
        <div className="px-4 py-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Evolución del peso</p>
          <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/10">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                {initialWeight && (
                  <ReferenceLine y={initialWeight} stroke="#6b7280" strokeDasharray="4 4" label={{ value: 'Inicial', fill: '#6b7280', fontSize: 10, position: 'insideTopLeft' }} />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props
                    return <circle key={payload.date} cx={cx} cy={cy} r={payload.official ? 5 : 3} fill={payload.official ? '#3b82f6' : '#1d4ed8'} stroke={payload.official ? '#93c5fd' : 'none'} strokeWidth={2} />
                  }}
                  activeDot={{ r: 6, fill: '#60a5fa' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-300" />
                Oficial (lunes)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-700" />
                Control
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Historial</p>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">⚖️</p>
            <p className="text-sm">No hay registros todavía</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...entries].reverse().map((entry, i) => {
              const delta = initialWeight ? (entry.weight - initialWeight) : null
              return (
                <div
                  key={`${entry.date}-${entry.official}`}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    entry.official ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{entry.weight} kg</p>
                      {entry.official && <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">Oficial</span>}
                    </div>
                    <p className="text-xs text-gray-400">{formatDateFull(entry.date)}</p>
                  </div>
                  {delta !== null && (
                    <p className={`text-sm font-bold ${delta < 0 ? 'text-green-400' : delta > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
                    </p>
                  )}
                  <button
                    onClick={() => handleDelete(entry.date, entry.official)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7"/>
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && <AddModal onSave={handleSaveEntry} onClose={() => setShowModal(false)} />}
    </div>
  )
}
