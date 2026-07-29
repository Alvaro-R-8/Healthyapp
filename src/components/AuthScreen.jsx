import { useState } from 'react';
import { C, mono, sans, display } from '../utils/design.js';
import { supabase, supabaseConfigured } from '../utils/supabaseClient.js';
import Icon from './Icon.jsx';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, fontFamily: mono, fontSize: 14, outline: 'none', width: '100%' };

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: sans, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: display, marginBottom: 10 }}>Falta configurar Supabase</div>
          <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
            Añade <code style={{ color: C.amber }}>VITE_SUPABASE_URL</code> y <code style={{ color: C.amber }}>VITE_SUPABASE_ANON_KEY</code> como variables de entorno (o GitHub Secrets) y vuelve a compilar la app.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: sans, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: C.blue + '1a', border: `1px solid ${C.blue}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Icon name="lock" size={22} color={C.blue} />
        </div>
        <div style={{ fontSize: 10, color: C.blue, letterSpacing: '0.2em', fontFamily: mono, marginBottom: 8 }}>HEALTHYAPP</div>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: display, lineHeight: 1.1, marginBottom: 10 }}>Inicia sesión</div>

        {sent ? (
          <div style={{ background: C.surfaceHigh, border: `1px solid ${C.green}44`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 6 }}>✓ Enlace enviado</div>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
              Revisa tu correo (<span style={{ color: C.text }}>{email}</span>) y toca el enlace para entrar. Puedes cerrar esta pestaña.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 20 }}>
              Te enviamos un enlace mágico a tu email, sin contraseñas. Tus datos se guardan en la nube y estarán disponibles en todos tus dispositivos.
            </div>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ ...inp, marginBottom: 10 }}
            />
            {error && <div style={{ fontSize: 12, color: C.red, marginBottom: 10, fontFamily: mono }}>{error}</div>}
            <button
              onClick={handleSend}
              disabled={loading || !email.trim()}
              style={{ width: '100%', padding: 13, background: email.trim() ? C.blue : C.surfaceHigh, color: email.trim() ? '#fff' : C.textLow, border: 'none', borderRadius: 10, fontFamily: display, fontSize: 15, fontWeight: 700, cursor: email.trim() ? 'pointer' : 'default' }}
            >
              {loading ? 'Enviando...' : 'Enviar enlace mágico'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
