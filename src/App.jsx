import { useState } from 'react';
import Home from './components/Home.jsx';
import TrainingScreen from './components/TrainingScreen.jsx';
import WeightScreen from './components/WeightScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';

export default function App() {
  const [screen, setScreen] = useState('home');

  if (screen === 'training') return <TrainingScreen onBack={() => setScreen('home')} onSettings={() => setScreen('settings')} />;
  if (screen === 'weight') return <WeightScreen onBack={() => setScreen('home')} onSettings={() => setScreen('settings')} />;
  if (screen === 'settings') return <SettingsScreen onBack={() => setScreen('home')} />;
  return <Home onNavigate={setScreen} />;
}
