import { useState } from 'react';
import { C, sans, display, APP_NAME } from '../utils/design.js';
import { supabase, supabaseConfigured } from '../utils/supabaseClient.js';
import Icon from './Icon.jsx';
import { GlassCard, Button, LogoMark, inputStyle } from './ui.jsx';

const LINK_RE = /https:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/i;

// iOS often reloads the installed app while the user is in Mail copying the
// link, so the "waiting for the link" step is kept in localStorage.
const PENDING_KEY = 'kora_login_pending';
const PENDING_MAX_AGE = 60 * 60 * 1000;

function readPending() {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
    return p && Date.now() - p.sentAt < PENDING_MAX_AGE ? p : null;
  } catch { return null; }
}
const savePending = (email) => { try { localStorage.setItem(PENDING_KEY, JSON.stringify({ email, sentAt: Date.now() })); } catch {} };
const clearPending = () => { try { localStorage.removeItem(PENDING_KEY); } catch {} };

export default function AuthScreen() {
  const [email, setEmail] = useState(() => readPending()?.email || '');
  const [sent, setSent] = useState(() => !!readPending());
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
    else { savePending(email.trim()); setSent(true); }
  };

  const handleVerifyLink = async (text = pastedLink) => {
    setLinkError('');
    const match = text.match(LINK_RE);
    if (!match) { setLinkError(`No hemos encontrado un enlace de inicio de sesión de ${APP_NAME} en ese texto.`); return; }
    let url;
    try { url = new URL(match[0]); } catch { setLinkError('El enlace no es válido.'); return; }
    const token_hash = url.searchParams.get('token');
    const type = url.searchParams.get('type') || 'magiclink';
    if (!token_hash) { setLinkError('El enlace no trae token. Pide uno nuevo.'); return; }

    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    setVerifying(false);
    if (error) setLinkError('El enlace ha caducado o ya se usó. Pide uno nuevo.');
    else clearPending();
    // on success App.jsx's onAuthStateChange picks up the new session automatically
  };

  const handlePasteFromClipboard = async () => {
    setLinkError('');
    let text = '';
    try { text = await navigator.clipboard.readText(); } catch {}
    if (!text) { setLinkError('No se pudo leer el portapapeles. Pega el enlace a mano en el campo.'); return; }
    setPastedLink(text);
    handleVerifyLink(text);
  };

  const handleForceUpdate = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch {}
    window.location.reload();
  };

  const wrap = { minHeight: '100vh', color: C.text, fontFamily: sans, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(env(safe-area-inset-top) + 24px) 20px 24px' };

  if (!supabaseConfigured) {
    return (
      <div style={wrap}>
        <GlassCard radius={30} padding={24} style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: display, marginBottom: 10 }}>Falta configurar Supabase</div>
          <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.65 }}>
            Añade <code style={{ color: C.primaryText }}>VITE_SUPABASE_URL</code> y <code style={{ color: C.primaryText }}>VITE_SUPABASE_ANON_KEY</code> como variables de entorno (o GitHub Secrets) y vuelve a compilar la app.
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 26 }}>
          <LogoMark size={76} />
          <div style={{ fontFamily: display, fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 16 }}>{APP_NAME}</div>
          <div style={{ fontSize: 15, color: C.textMid, marginTop: 4 }}>Tu entreno y tu peso, en un solo sitio</div>
        </div>

        <GlassCard radius={30} padding={22} style={{ display: 'flex', flexDirection: 'column', gap: 12, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          {sent ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.success + '2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="check" size={18} color={C.success} />
                </div>
                <div style={{ fontFamily: display, fontSize: 20, fontWeight: 800 }}>Email enviado</div>
              </div>
              <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.6 }}>
                Abre tu correo{email ? <> (<span style={{ color: C.text }}>{email}</span>)</> : ''}. <strong style={{ color: C.text }}>No toques el enlace</strong>: mantén el dedo pulsado sobre él y elige <strong style={{ color: C.text }}>«Copiar»</strong>. Luego vuelve aquí y pulsa el botón de abajo. La app recuerda que estás esperando el enlace.
              </div>
              <Button icon="copy" onClick={handlePasteFromClipboard} disabled={verifying}>
                {verifying ? 'Comprobando...' : 'Pegar enlace y entrar'}
              </Button>
              <div style={{ fontSize: 13, color: C.textMid, textAlign: 'center' }}>o pégalo a mano:</div>
              <textarea
                aria-label="Enlace del email"
                placeholder="https://...supabase.co/auth/v1/verify?token=..."
                value={pastedLink}
                onChange={e => setPastedLink(e.target.value)}
                rows={3}
                style={{ ...inputStyle(), fontSize: 13, resize: 'none' }}
              />
              {linkError && <div style={{ fontSize: 14, color: C.dangerText }}>{linkError}</div>}
              <Button variant="glass" onClick={() => handleVerifyLink()} disabled={verifying || !pastedLink.trim()}>
                Entrar con este enlace
              </Button>
              <button
                onClick={() => { clearPending(); setSent(false); setPastedLink(''); setLinkError(''); }}
                style={{ padding: 8, background: 'none', border: 'none', color: C.textMid, fontSize: 14, fontWeight: 600 }}
              >
                ← Usar otro email o reenviar
              </button>
            </>
          ) : (
            <>
              <div style={{ fontFamily: display, fontSize: 22, fontWeight: 800 }}>Inicia sesión</div>
              <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.6 }}>
                Te enviamos un enlace mágico a tu email, sin contraseñas. Tus datos se guardan en la nube y estarán en todos tus dispositivos.
              </div>
              <input
                type="email"
                aria-label="Email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={inputStyle()}
              />
              {error && <div style={{ fontSize: 14, color: C.dangerText }}>{error}</div>}
              <Button onClick={handleSend} disabled={loading || !email.trim()}>
                {loading ? 'Enviando...' : 'Enviar enlace mágico'}
              </Button>
              <button
                onClick={() => { setSent(true); setError(''); }}
                style={{ padding: 8, background: 'none', border: 'none', color: C.textMid, fontSize: 14, fontWeight: 600 }}
              >
                Ya tengo un enlace →
              </button>
            </>
          )}
        </GlassCard>

        <button
          onClick={handleForceUpdate}
          style={{ width: '100%', marginTop: 22, padding: 10, background: 'none', border: 'none', color: C.textMid, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Icon name="refresh" size={14} color={C.textMid} />
          Forzar actualización de la app
        </button>
      </div>
    </div>
  );
}
