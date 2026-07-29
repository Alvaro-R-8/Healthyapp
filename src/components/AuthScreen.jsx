import { useState } from 'react';
import { C, mono, sans, display } from '../utils/design.js';
import { supabase, supabaseConfigured } from '../utils/supabaseClient.js';
import Icon from './Icon.jsx';

const LINK_RE = /https:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/i;

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pastedLink, setPastedLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL, shouldCreateUser: true },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  const handleVerifyLink = async () => {
    setLinkError('');
    const match = pastedLink.match(LINK_RE);
    if (!match) { setLinkError('No hemos encontrado un enlace de HealthyApp/Supabase en ese texto.'); return; }
    let url;
    try { url = new URL(match[0]); } catch { setLinkError('El enlace no es válido.'); return; }
    const token_hash = url.searchParams.get('token');
    const type = url.searchParams.get('type') || 'magiclink';
    if (!token_hash) { setLinkError('El enlace no trae token. Pide uno nuevo.'); return; }

    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    setVerifying(false);
    if (error) setLinkError('El enlace ha caducado o ya se usó. Pide uno nuevo.');
    // on success App.jsx's onAuthStateChange picks up the new session automatically
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
          <>
            <div style={{ background: C.surfaceHigh, border: `1px solid ${C.green}44`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 6 }}>✓ Email enviado</div>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
                Revisa tu correo (<span style={{ color: C.text }}>{email}</span>). <strong style={{ color: C.text }}>No toques el enlace</strong> — mantén el dedo pulsado sobre él, elige <strong style={{ color: C.text }}>"Copiar"</strong> y pégalo aquí abajo. Así evitas que se abra Safari y se queda dentro de esta app.
              </div>
            </div>
            <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 6, letterSpacing: '0.08em' }}>PEGAR ENLACE DEL EMAIL</div>
            <textarea
              placeholder="https://...supabase.co/auth/v1/verify?token=..."
              value={pastedLink}
              onChange={e => setPastedLink(e.target.value)}
              rows={3}
              style={{ ...inp, marginBottom: 10, fontSize: 11, resize: 'none' }}
            />
            {linkError && <div style={{ fontSize: 12, color: C.red, marginBottom: 10, fontFamily: mono }}>{linkError}</div>}
            <button
              onClick={handleVerifyLink}
              disabled={verifying || !pastedLink.trim()}
              style={{ width: '100%', padding: 13, background: pastedLink.trim() ? C.green : C.surfaceHigh, color: pastedLink.trim() ? '#08150d' : C.textLow, border: 'none', borderRadius: 10, fontFamily: display, fontSize: 15, fontWeight: 700, cursor: pastedLink.trim() ? 'pointer' : 'default', marginBottom: 10 }}
            >
              {verifying ? 'Comprobando...' : 'Entrar con este enlace'}
            </button>
            <button
              onClick={() => { setSent(false); setPastedLink(''); setLinkError(''); }}
              style={{ width: '100%', padding: 0, background: 'none', border: 'none', color: C.textLow, fontFamily: mono, fontSize: 12, cursor: 'pointer' }}
            >
              ← Usar otro email / reenviar
            </button>
          </>
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
