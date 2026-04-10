import { useState } from 'react'
import RunningTrainer from './components/RunningTrainer'
import WeightControl from './components/WeightControl'
import Dashboard from './components/Dashboard'

const TABS = [
  { id: 'running', label: 'Running', icon: RunIcon },
  { id: 'weight', label: 'Peso', icon: WeightIcon },
  { id: 'dashboard', label: 'Dashboard', icon: ChartIcon },
]

function RunIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? '#22c55e' : '#6b7280'} strokeWidth={2}>
      <path d="M13 4a1 1 0 1 1 2 0 1 1 0 0 1-2 0" fill={active ? '#22c55e' : '#6b7280'} stroke="none"/>
      <circle cx="14" cy="4" r="1.5" fill={active ? '#22c55e' : '#6b7280'}/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20l3-6 2-2 1-4 3 2 2-4"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 6l-1 4-3 2-2 6"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20h3M16 8l3-1"/>
    </svg>
  )
}

function WeightIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? '#3b82f6' : '#6b7280'} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18"/>
      <rect x="7" y="3" width="10" height="18" rx="2" stroke={active ? '#3b82f6' : '#6b7280'} strokeWidth={2}/>
    </svg>
  )
}

function WeightIcon2({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={active ? '#3b82f6' : '#6b7280'} strokeWidth={2}>
      <circle cx="12" cy="12" r="8"/>
      <path strokeLinecap="round" d="M12 8v4l2 2"/>
    </svg>
  )
}

function ChartIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={active ? '#a855f7' : '#6b7280'} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l4-4 4 4 4-6 4 2"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18"/>
    </svg>
  )
}

export default function App() {
  const [tab, setTab] = useState('running')

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col max-w-md mx-auto relative">
      <div className="flex-1 overflow-y-auto pb-20">
        {tab === 'running' && <RunningTrainer />}
        {tab === 'weight' && <WeightControl />}
        {tab === 'dashboard' && <Dashboard />}
      </div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#1a1a2e] border-t border-white/10 flex pb-safe z-50">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
          >
            <Icon active={tab === id} />
            <span className={`text-xs font-medium transition-colors ${tab === id ? (id === 'running' ? 'text-green-400' : id === 'weight' ? 'text-blue-400' : 'text-purple-400') : 'text-gray-500'}`}>
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
