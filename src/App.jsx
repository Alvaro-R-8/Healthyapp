import { useEffect, useState } from 'react';
import Home from './components/Home.jsx';
import TrainingScreen from './components/TrainingScreen.jsx';
import WeightScreen from './components/WeightScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import { supabase, supabaseConfigured } from './utils/supabaseClient.js';
import { initStore } from './utils/storage.js';
import { C, mono } from './utils/design.js';

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.textMid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 12 }}>
      Cargando...
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [session, setSession] = useState(undefined); // undefined = checking, null = logged out
  const [storeReady, setStoreReady] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setSession(null); return; }

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) setStoreReady(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    initStore(session.user.id).then(() => setStoreReady(true));
  }, [session?.user?.id]);

  if (!supabaseConfigured || session === null) return <AuthScreen />;
  if (session === undefined || !storeReady) return <LoadingScreen />;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setScreen('home');
  };

  if (screen === 'training') return <TrainingScreen onBack={() => setScreen('home')} onSettings={() => setScreen('settings')} />;
  if (screen === 'weight') return <WeightScreen onBack={() => setScreen('home')} onSettings={() => setScreen('settings')} />;
  if (screen === 'settings') return <SettingsScreen onBack={() => setScreen('home')} userEmail={session.user.email} onSignOut={handleSignOut} />;
  return <Home onNavigate={setScreen} />;
}
