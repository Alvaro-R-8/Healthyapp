import { useEffect, useState } from 'react';
import Home from './components/Home.jsx';
import TrainingScreen from './components/TrainingScreen.jsx';
import WeightScreen from './components/WeightScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import Icon from './components/Icon.jsx';
import { LogoMark, Toast, GlassCard, Button } from './components/ui.jsx';
import { supabase, supabaseConfigured } from './utils/supabaseClient.js';
import { initStore, onSyncMessage } from './utils/storage.js';
import { C, sans, display, applyTheme, getThemePref, setThemePref, resolveTheme } from './utils/design.js';

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', color: C.textMid, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontSize: 14 }}>
      <LogoMark size={56} />
      Cargando...
    </div>
  );
}

// Shown when the cloud read fails, so a broken load never looks like an
// empty account (which could lead to importing over real data).
function LoadErrorScreen({ error, onRetry, onSignOut }) {
  const auth = error?.status === 401 || /jwt|token|auth/i.test(`${error?.code} ${error?.message}`);
  return (
    <div style={{ minHeight: '100vh', color: C.text, fontFamily: sans, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <GlassCard radius={30} padding={22} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <LogoMark size={48} />
        <div style={{ fontFamily: display, fontSize: 22, fontWeight: 800 }}>No se han podido cargar tus datos</div>
        <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.55 }}>
          {auth
            ? 'Tu sesión ya no es válida (puede pasar al cambiar las claves de Supabase). Cierra sesión y vuelve a entrar con el enlace del email.'
            : 'Puede ser un problema de conexión. Tus datos siguen guardados en la nube; reintenta en un momento.'}
        </div>
        <div style={{ fontSize: 12, color: C.textLow, fontFamily: 'ui-monospace, Menlo, monospace', wordBreak: 'break-word' }}>
          {[error?.code, error?.message].filter(Boolean).join(' · ') || String(error)}
        </div>
        <Button onClick={onRetry}>Reintentar</Button>
        <Button variant="glass" onClick={onSignOut}>Cerrar sesión y volver a entrar</Button>
      </GlassCard>
    </div>
  );
}

const TABS = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'training', label: 'Entrenos', icon: 'run' },
  { id: 'weight', label: 'Peso', icon: 'scale' },
  { id: 'settings', label: 'Ajustes', icon: 'sliders' },
];

function TabBar({ screen, onChange }) {
  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: 'fixed', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 448,
        bottom: 'calc(env(safe-area-inset-bottom) + 14px)', height: 68, borderRadius: 999, zIndex: 100,
        background: C.navBg, border: `1px solid ${C.glassBorder}`,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', alignItems: 'center', padding: '0 8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
      }}
    >
      {TABS.map(t => {
        const on = screen === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            aria-current={on ? 'page' : undefined}
            style={on ? {
              height: 52, margin: '0 2px', borderRadius: 999, border: 'none', background: C.primary, color: C.onPrimary,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 800, padding: '0 4px',
            } : {
              height: 52, border: 'none', background: 'transparent', color: C.textMid,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontFamily: sans, fontSize: 11, fontWeight: 600,
            }}
          >
            <Icon name={t.icon} size={on ? 20 : 22} color={on ? C.onPrimary : C.textMid} />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [session, setSession] = useState(undefined); // undefined = checking, null = logged out
  const [storeReady, setStoreReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [syncMsg, setSyncMsg] = useState('');
  const [themePref, setThemePrefState] = useState(getThemePref);
  const [themeMode, setThemeMode] = useState(() => {
    const mode = resolveTheme(getThemePref());
    applyTheme(mode);
    return mode;
  });

  const changeTheme = (pref) => {
    setThemePref(pref);
    setThemePrefState(pref);
    const mode = resolveTheme(pref);
    applyTheme(mode);
    setThemeMode(mode);
  };

  // Follow the OS setting while the preference is "system".
  useEffect(() => {
    if (themePref !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      const mode = mq.matches ? 'light' : 'dark';
      applyTheme(mode);
      setThemeMode(mode);
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [themePref]);

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
    setStoreReady(false);
    setLoadError(null);
    initStore(session.user.id)
      .then(res => { if (res?.error) setLoadError(res.error); })
      .catch(err => { console.error('[sync] init:', err); setLoadError(err); })
      .finally(() => setStoreReady(true));
  }, [session?.user?.id, loadAttempt]);

  // Cloud save/load problems reported by storage.js.
  useEffect(() => {
    let timer;
    const off = onSyncMessage(msg => {
      setSyncMsg(msg);
      clearTimeout(timer);
      timer = setTimeout(() => setSyncMsg(''), 4500);
    });
    return () => { off(); clearTimeout(timer); };
  }, []);

  // iOS opens the magic link in Safari, not in the installed home-screen app —
  // re-check for a session whenever the app regains focus so it picks up a
  // login that just happened in the other browsing context.
  useEffect(() => {
    if (!supabaseConfigured) return;
    const recheck = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) setSession(data.session);
        });
      }
    };
    document.addEventListener('visibilitychange', recheck);
    window.addEventListener('focus', recheck);
    window.addEventListener('pageshow', recheck);
    return () => {
      document.removeEventListener('visibilitychange', recheck);
      window.removeEventListener('focus', recheck);
      window.removeEventListener('pageshow', recheck);
    };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  if (!supabaseConfigured || session === null) return <AuthScreen key={themeMode} />;
  if (session === undefined || !storeReady) return <LoadingScreen />;

  const handleSignOut = async () => {
    // With a no-longer-valid session the server call fails; still clear it locally.
    const { error } = await supabase.auth.signOut();
    if (error) await supabase.auth.signOut({ scope: 'local' });
    setScreen('home');
  };

  if (loadError) return <LoadErrorScreen error={loadError} onRetry={() => setLoadAttempt(n => n + 1)} onSignOut={handleSignOut} />;

  return (
    // key forces a full re-render after a theme switch so every C.x read refreshes
    <div key={themeMode}>
      {screen === 'home' && <Home onNavigate={setScreen} />}
      {screen === 'training' && <TrainingScreen />}
      {screen === 'weight' && <WeightScreen />}
      {screen === 'settings' && <SettingsScreen userEmail={session.user.email} onSignOut={handleSignOut} themePref={themePref} onThemeChange={changeTheme} />}
      <TabBar screen={screen} onChange={setScreen} />
      {syncMsg && <Toast>{syncMsg}</Toast>}
    </div>
  );
}
