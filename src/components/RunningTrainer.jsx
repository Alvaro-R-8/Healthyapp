import { useState, useEffect, useCallback } from 'react'
import {
  getWeekWorkouts, getWeekDates, getCurrentWeek,
  getPhaseName, getWeeklyKm, DAY_LABELS, DAY_FULL
} from '../utils/marathonPlan'
import { getStartDate, setStartDate, getCompleted, toggleCompleted } from '../utils/storage'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

const TYPE_CONFIG = {
  run:      { bg: 'bg-green-500/20',   border: 'border-green-500/40',  dot: 'bg-green-400',   label: 'Carrera',   icon: '🏃' },
  strength: { bg: 'bg-blue-500/20',    border: 'border-blue-500/40',   dot: 'bg-blue-400',    label: 'Fuerza',    icon: '💪' },
  rest:     { bg: 'bg-gray-500/10',    border: 'border-gray-600/30',   dot: 'bg-gray-500',    label: 'Descanso',  icon: '😴' },
  race:     { bg: 'bg-yellow-500/20',  border: 'border-yellow-500/50', dot: 'bg-yellow-400',  label: '¡CARRERA!', icon: '🏆' },
}

const INTENSITY_LABEL = {
  easy: { text: 'Suave', color: 'text-green-400 bg-green-400/10' },
  moderate: { text: 'Moderado', color: 'text-blue-400 bg-blue-400/10' },
  tempo: { text: 'Tempo', color: 'text-orange-400 bg-orange-400/10' },
  intervals: { text: 'Intervalos', color: 'text-red-400 bg-red-400/10' },
  race: { text: '¡MARATÓN!', color: 'text-yellow-400 bg-yellow-400/10' },
}

function SetupScreen({ onStart }) {
  const [date, setDate] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const mon = new Date(today)
    mon.setDate(today.getDate() + diff)
    return mon.toISOString().split('T')[0]
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="text-6xl mb-6">🏃</div>
      <h1 className="text-2xl font-bold text-white mb-2 text-center">Plan Maratón en 1 Año</h1>
      <p className="text-gray-400 text-sm text-center mb-8">
        52 semanas de entrenamiento progresivo. Elige el lunes de inicio de tu plan.
      </p>

      <div className="w-full bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 mb-6">
        <label className="block text-sm text-gray-400 mb-2">Lunes de inicio del plan</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full bg-[#16213e] text-white rounded-xl px-4 py-3 border border-white/10 text-base appearance-none focus:outline-none focus:border-green-500/50"
        />
        <p className="text-xs text-gray-500 mt-2">Elige siempre un lunes para que el plan encaje correctamente</p>
      </div>

      <div className="w-full bg-[#1a1a2e] rounded-2xl p-4 border border-white/10 mb-8 space-y-2">
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <span className="text-green-400">🏃 Mar / Jue / Sáb</span>
          <span>— Entrenos de running</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <span className="text-blue-400">💪 Lun / Mié / Vie</span>
          <span>— Entrenamientos de fuerza</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <span className="text-gray-400">😴 Dom</span>
          <span>— Descanso y recuperación</span>
        </div>
      </div>

      <button
        onClick={() => onStart(date)}
        className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95"
      >
        Comenzar Plan
      </button>
    </div>
  )
}

function WorkoutBadge({ workout, completed, onToggle, dateStr }) {
  const cfg = TYPE_CONFIG[workout.type] || TYPE_CONFIG.rest
  return (
    <div className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border} ${completed ? 'opacity-60' : ''} transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{completed ? '✅' : cfg.icon}</span>
          <div>
            <p className={`text-xs font-semibold ${completed ? 'line-through text-gray-400' : 'text-white'}`}>
              {workout.title}
            </p>
            {workout.distance && (
              <p className="text-xs text-gray-400">{workout.distance} km</p>
            )}
          </div>
        </div>
        {workout.type !== 'rest' && (
          <button
            onClick={onToggle}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
              completed ? 'bg-green-500 border-green-500' : 'border-gray-500 bg-transparent'
            }`}
          >
            {completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
          </button>
        )}
      </div>
    </div>
  )
}

function DayModal({ day, workout, date, completed, onToggle, onClose }) {
  const cfg = TYPE_CONFIG[workout.type] || TYPE_CONFIG.rest
  const intensity = workout.intensity ? INTENSITY_LABEL[workout.intensity] : null

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full max-w-md mx-auto bg-[#1a1a2e] rounded-t-3xl p-6 slide-up max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-6" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{DAY_FULL[day]} · {date}</p>
            <h2 className="text-xl font-bold text-white mt-1">{workout.title}</h2>
          </div>
          <span className="text-3xl">{workout.type === 'race' ? '🏆' : cfg.icon}</span>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.bg} border ${cfg.border}`}>
            {cfg.label}
          </span>
          {intensity && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${intensity.color}`}>
              {intensity.text}
            </span>
          )}
          {workout.distance && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 text-gray-300">
              {workout.distance} km
            </span>
          )}
        </div>

        <p className="text-gray-300 text-sm leading-relaxed mb-4">{workout.description}</p>

        {(workout.warmup || workout.cooldown) && (
          <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
            {workout.warmup && (
              <div className="flex gap-2 text-sm">
                <span className="text-yellow-400 font-semibold min-w-[90px]">Calentamiento</span>
                <span className="text-gray-300">{workout.warmup}</span>
              </div>
            )}
            {workout.cooldown && (
              <div className="flex gap-2 text-sm">
                <span className="text-blue-400 font-semibold min-w-[90px]">Enfriamiento</span>
                <span className="text-gray-300">{workout.cooldown}</span>
              </div>
            )}
          </div>
        )}

        {workout.exercises && workout.exercises.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Ejercicios</p>
            <div className="space-y-2">
              {workout.exercises.map((ex, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-white">{ex.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ex.sets} series × {ex.reps} · Descanso {ex.rest}</p>
                    </div>
                  </div>
                  {ex.tip && <p className="text-xs text-blue-400 mt-1 italic">{ex.tip}</p>}
                </div>
              ))}
            </div>
            {workout.focus && (
              <p className="text-xs text-gray-500 mt-2">Músculos: {workout.focus}</p>
            )}
          </div>
        )}

        {workout.type !== 'rest' && (
          <button
            onClick={onToggle}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 ${
              completed
                ? 'bg-gray-700 text-gray-300 border border-gray-600'
                : 'bg-green-500 text-white'
            }`}
          >
            {completed ? '✅ Entreno completado — Desmarcar' : '✓ Marcar como completado'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function RunningTrainer() {
  const [startDate, setStartDateState] = useState(getStartDate)
  const [week, setWeek] = useState(1)
  const [completed, setCompleted] = useState(getCompleted)
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    if (startDate) {
      setWeek(getCurrentWeek(startDate))
    }
  }, [startDate])

  const handleStart = useCallback((date) => {
    setStartDate(date)
    setStartDateState(date)
    setWeek(1)
  }, [])

  const workouts = startDate ? getWeekWorkouts(week) : null
  const dates = startDate ? getWeekDates(startDate, week) : null
  const phase = startDate ? getPhaseName(week) : null

  const handleToggle = useCallback((day) => {
    const id = `w${week}-${day}`
    const updated = toggleCompleted(id)
    setCompleted([...updated])
  }, [week])

  if (!startDate) return <SetupScreen onStart={handleStart} />

  const totalWeekKm = getWeeklyKm(week)
  const doneThisWeek = DAYS.filter(d => workouts[d].type !== 'rest' && completed.includes(`w${week}-${d}`)).length
  const totalWorkouts = DAYS.filter(d => workouts[d].type !== 'rest').length

  const selectedWorkout = selectedDay ? workouts[selectedDay] : null

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-white">Entrenador Running</h1>
          <button
            onClick={() => { setStartDateState(null); setStartDate(null); localStorage.removeItem('happ_start_date') }}
            className="text-xs text-gray-500 px-2 py-1 rounded-lg bg-white/5"
          >
            Reiniciar
          </button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: phase.color + '22', color: phase.color }}>
            Semana {week}/52 · {phase.name}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Km semana</p>
            <p className="text-lg font-bold text-green-400">{totalWeekKm}</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Completados</p>
            <p className="text-lg font-bold text-blue-400">{doneThisWeek}/{totalWorkouts}</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Maratón en</p>
            <p className="text-lg font-bold text-purple-400">{Math.max(0, 52 - week + 1)}s</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeek(w => Math.max(1, w - 1))}
            disabled={week === 1}
            className="bg-white/10 disabled:opacity-30 rounded-xl px-4 py-2 text-sm font-semibold text-white active:bg-white/20"
          >
            ← Ant
          </button>
          <span className="text-sm text-gray-400">
            {dates?.monday} — {dates?.sunday}
          </span>
          <button
            onClick={() => setWeek(w => Math.min(52, w + 1))}
            disabled={week === 52}
            className="bg-white/10 disabled:opacity-30 rounded-xl px-4 py-2 text-sm font-semibold text-white active:bg-white/20"
          >
            Sig →
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {DAYS.map(day => {
          const workout = workouts[day]
          const date = dates[day]
          const id = `w${week}-${day}`
          const done = completed.includes(id)
          const cfg = TYPE_CONFIG[workout.type] || TYPE_CONFIG.rest

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] text-left ${cfg.bg} ${cfg.border} ${done ? 'opacity-60' : ''}`}
            >
              <div className="text-center min-w-[40px]">
                <p className="text-xs text-gray-400 font-semibold">{DAY_LABELS[day]}</p>
                <p className="text-xs text-gray-500">{date?.slice(5)}</p>
              </div>

              <div className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${done ? 'line-through text-gray-400' : 'text-white'}`}>
                    {workout.title}
                  </p>
                  {workout.type === 'race' && <span className="text-base">🏆</span>}
                </div>
                {workout.distance && (
                  <p className="text-xs text-gray-400">{workout.distance} km · {workout.intensity ? INTENSITY_LABEL[workout.intensity]?.text : ''}</p>
                )}
                {workout.exercises && (
                  <p className="text-xs text-gray-400">{workout.exercises.length} ejercicios</p>
                )}
              </div>

              {workout.type !== 'rest' && (
                <div
                  onClick={e => { e.stopPropagation(); handleToggle(day) }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    done ? 'bg-green-500 border-green-500' : 'border-gray-500 bg-transparent'
                  }`}
                >
                  {done && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                </div>
              )}

              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          )
        })}
      </div>

      {selectedDay && selectedWorkout && (
        <DayModal
          day={selectedDay}
          workout={selectedWorkout}
          date={dates[selectedDay]}
          completed={completed.includes(`w${week}-${selectedDay}`)}
          onToggle={() => { handleToggle(selectedDay); }}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}
