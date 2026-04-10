import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine
} from 'recharts'
import { getStartDate, getCompleted, getWeightEntries, getInitialWeight } from '../utils/storage'
import { getWeekWorkouts, getWeeklyKm, getCurrentWeek, getPhaseName } from '../utils/marathonPlan'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

function StatCard({ title, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/10">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function ProgressBar({ pct, color = 'bg-green-500', label, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const startDate = getStartDate()
  const completed = getCompleted()
  const weightEntries = getWeightEntries()
  const initialWeight = getInitialWeight()

  const stats = useMemo(() => {
    if (!startDate) return null
    const currentWeek = getCurrentWeek(startDate)
    const phase = getPhaseName(currentWeek)

    let totalRunningDone = 0
    let totalStrengthDone = 0
    let totalRunningPossible = 0
    let totalStrengthPossible = 0
    let totalKmLogged = 0

    for (let w = 1; w <= currentWeek; w++) {
      const workouts = getWeekWorkouts(w)
      DAYS.forEach(day => {
        const wk = workouts[day]
        const id = `w${w}-${day}`
        if (wk.type === 'run' || wk.type === 'race') {
          totalRunningPossible++
          if (completed.includes(id)) {
            totalRunningDone++
            totalKmLogged += wk.distance || 0
          }
        }
        if (wk.type === 'strength') {
          totalStrengthPossible++
          if (completed.includes(id)) totalStrengthDone++
        }
      })
    }

    const weeklyKmData = []
    for (let w = Math.max(1, currentWeek - 7); w <= currentWeek; w++) {
      const total = getWeeklyKm(w)
      const done = DAYS.reduce((acc, day) => {
        const wk = getWeekWorkouts(w)[day]
        return acc + (completed.includes(`w${w}-${day}`) && (wk.type === 'run' || wk.type === 'race') ? (wk.distance || 0) : 0)
      }, 0)
      weeklyKmData.push({ week: `S${w}`, planned: total, done: Math.round(done * 10) / 10 })
    }

    const officialWeights = weightEntries.filter(e => e.official)
    const weightDiff = initialWeight && officialWeights.length
      ? officialWeights[officialWeights.length - 1].weight - initialWeight
      : null

    const adherenceRunning = totalRunningPossible > 0 ? Math.round((totalRunningDone / totalRunningPossible) * 100) : 0
    const adherenceStrength = totalStrengthPossible > 0 ? Math.round((totalStrengthDone / totalStrengthPossible) * 100) : 0

    return {
      currentWeek,
      phase,
      totalRunningDone,
      totalStrengthDone,
      totalKmLogged: Math.round(totalKmLogged * 10) / 10,
      adherenceRunning,
      adherenceStrength,
      weeklyKmData,
      officialWeights,
      weightDiff,
      weeksLeft: 52 - currentWeek,
    }
  }, [startDate, completed, weightEntries, initialWeight])

  if (!startDate && !initialWeight) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="text-6xl mb-4">📊</div>
        <h1 className="text-xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400 text-sm text-center">
          Configura tu plan de running y tu peso inicial para ver el dashboard de progreso.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white mb-1">Dashboard</h1>
        {stats && (
          <p className="text-xs text-gray-400">
            Semana {stats.currentWeek}/52 · {stats.phase.name}
          </p>
        )}
      </div>

      <div className="px-4 py-4 space-y-6">

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Semana actual" value={`${stats.currentWeek}/52`} sub={`Quedan ${stats.weeksLeft} semanas`} color="text-purple-400" />
              <StatCard title="Km registrados" value={`${stats.totalKmLogged}`} sub="km completados" color="text-green-400" />
              <StatCard title="Entrenos running" value={stats.totalRunningDone} sub={`${stats.adherenceRunning}% adherencia`} color="text-green-400" />
              <StatCard title="Entrenos fuerza" value={stats.totalStrengthDone} sub={`${stats.adherenceStrength}% adherencia`} color="text-blue-400" />
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/10 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Adherencia al plan</p>
              <ProgressBar
                label="Running"
                value={`${stats.adherenceRunning}%`}
                pct={stats.adherenceRunning}
                color="bg-green-500"
              />
              <ProgressBar
                label="Fuerza"
                value={`${stats.adherenceStrength}%`}
                pct={stats.adherenceStrength}
                color="bg-blue-500"
              />
              <ProgressBar
                label="Plan completado"
                value={`${Math.round((stats.currentWeek / 52) * 100)}%`}
                pct={(stats.currentWeek / 52) * 100}
                color="bg-purple-500"
              />
            </div>

            {stats.weeklyKmData.length > 0 && (
              <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Km planificados vs completados (últimas semanas)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.weeklyKmData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#1f2b47', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#9ca3af' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="planned" fill="#22c55e22" stroke="#22c55e" strokeWidth={1} radius={[4,4,0,0]} name="Planificado" />
                    <Bar dataKey="done" fill="#22c55e" radius={[4,4,0,0]} name="Completado" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {initialWeight !== null && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Progreso de peso</p>

            {stats?.weightDiff !== null && (
              <div className={`rounded-2xl p-4 mb-3 border ${stats.weightDiff < 0 ? 'bg-green-500/10 border-green-500/30' : stats.weightDiff > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                <p className="text-xs text-gray-400">Cambio total desde el inicio</p>
                <p className={`text-3xl font-bold mt-1 ${stats.weightDiff < 0 ? 'text-green-400' : stats.weightDiff > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {stats.weightDiff > 0 ? '+' : ''}{stats.weightDiff.toFixed(1)} kg
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Inicial: {initialWeight} kg · Actual: {(initialWeight + stats.weightDiff).toFixed(1)} kg
                </p>
              </div>
            )}

            {stats?.officialWeights && stats.officialWeights.length >= 2 && (
              <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Pesajes oficiales (lunes)</p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={stats.officialWeights} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => d?.slice(5)}
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                    />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#1f2b47', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#9ca3af' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={v => [`${v} kg`]}
                      labelFormatter={l => l?.slice(5)}
                    />
                    {initialWeight && (
                      <ReferenceLine y={initialWeight} stroke="#6b7280" strokeDasharray="4 4" />
                    )}
                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} name="Peso" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {stats?.officialWeights && stats.officialWeights.length < 2 && (
              <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/10 text-center py-8">
                <p className="text-gray-500 text-sm">Añade al menos 2 pesajes oficiales para ver la gráfica</p>
              </div>
            )}
          </div>
        )}

        {stats && (
          <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Resumen del plan</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Inicio del plan</span>
                <span className="text-white font-semibold">{startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Maratón (semana 52)</span>
                <span className="text-white font-semibold">
                  {(() => {
                    const s = new Date(startDate)
                    s.setDate(s.getDate() + 51 * 7 + 5)
                    return s.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Km totales planificados</span>
                <span className="text-white font-semibold">
                  {Array.from({length: 52}, (_, i) => getWeeklyKm(i + 1)).reduce((a, b) => a + b, 0)} km
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
