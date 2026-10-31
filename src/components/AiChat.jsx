import { useState, useEffect, useRef } from 'react';
import { C, GRADIENT, sans } from '../utils/design.js';
import { getApiKey, setApiKey } from '../utils/storage.js';
import Icon from './Icon.jsx';
import { Sheet, Button, inputStyle } from './ui.jsx';

// The trainer chat (mode "training") is hidden for now; flip this to bring it
// back on Inicio and Entrenos. The weight coach is unaffected.
export const TRAINER_CHAT_ENABLED = false;

// `renderTrigger(open)` lets a screen place its own entry point; without it a
// floating button sits above the tab bar.
export default function AiChat(props) {
  if (props.mode === 'training' && !TRAINER_CHAT_ENABLED) return null;
  return <AiChatPanel {...props} />;
}

function AiChatPanel({ mode, context, renderTrigger }) {
  const [open, setOpen] = useState(false);
  const [keyPrompt, setKeyPrompt] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [msgs, setMsgs] = useState([{
    role: 'assistant',
    text: mode === 'training'
      ? 'Hola. Dime si necesitas ajustar algo del plan: una semana de viaje, una sesión cancelada o si el volumen se siente alto.'
      : 'Hola. Puedo ayudarte con tus datos de peso, estrategia de déficit, nutrición o lo que necesites.',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  const systemPrompt = mode === 'training'
    ? `Eres un entrenador personal experto. Contexto del plan actual: ${JSON.stringify(context)}. Responde en español de tú, tono cercano y directo. Máximo 3 párrafos.`
    : `Eres un coach de nutrición y control de peso. Contexto: meta=${context?.goalWeight != null ? context.goalWeight + "kg" : "sin definir"}, actual=${context?.currentWeight}kg, ritmo=${context?.weeklyRate}kg/semana. Responde en español de tú, basado en evidencia. Máximo 3 párrafos.`;

  const openChat = () => {
    if (!getApiKey()) {
      setKeyPrompt(true);
    } else {
      setOpen(true);
    }
  };

  const saveKey = () => {
    if (keyInput.trim().startsWith('sk-')) {
      setApiKey(keyInput.trim());
      setKeyPrompt(false);
      setKeyInput('');
      setOpen(true);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    const newMsgs = [...msgs, { role: 'user', text }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      // API requires messages to start with 'user' — skip any leading assistant messages
      const firstUserIdx = newMsgs.findIndex(m => m.role === 'user');
      const apiMessages = newMsgs.slice(firstUserIdx).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text,
      }));
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': getApiKey(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error?.message || `Error ${res.status}`;
        setMsgs(p => [...p, { role: 'assistant', text: `⚠️ ${errMsg}` }]);
        setLoading(false);
        return;
      }
      const reply = data.content?.map(c => c.text || '').join('').trim();
      setMsgs(p => [...p, { role: 'assistant', text: reply || '(respuesta vacía)' }]);
    } catch (err) {
      setMsgs(p => [...p, { role: 'assistant', text: 'Error de conexión. Comprueba tu red e inténtalo de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  const canSend = !loading && input.trim();

  return (
    <>
      {renderTrigger ? renderTrigger(openChat) : (
        <button
          onClick={openChat}
          aria-label="Abrir asistente IA"
          style={{
            position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 98px)', right: 'max(20px, calc(50% - 220px))',
            width: 54, height: 54, background: GRADIENT, border: 'none', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(255,94,126,0.35)', zIndex: 90,
          }}
        >
          <Icon name="sparkle" size={22} color={C.onPrimary} />
        </button>
      )}

      {keyPrompt && (
        <Sheet
          eyebrow={{ text: 'Asistente IA', color: C.accentText }}
          title="API key de Anthropic"
          onClose={() => setKeyPrompt(false)}
          footer={<Button onClick={saveKey} disabled={!keyInput.trim().startsWith('sk-')}>Guardar y continuar</Button>}
        >
          <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.6, marginBottom: 14 }}>
            Para usar el asistente IA necesitas una API key de Anthropic. Se guarda solo en tu dispositivo.
          </div>
          <input
            type="password"
            aria-label="API key"
            placeholder="sk-ant-..."
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveKey()}
            style={inputStyle()}
          />
        </Sheet>
      )}

      {open && (
        <Sheet
          eyebrow={{ text: mode === 'training' ? 'Entrenador IA' : 'Coach de nutrición IA', color: C.accentText }}
          title={mode === 'training' ? 'Ajusta tu plan' : 'Nutrición y peso'}
          onClose={() => setOpen(false)}
          maxHeight="82vh"
          footer={
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                aria-label="Mensaje"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={mode === 'training' ? 'Ej: el jueves no pude correr...' : 'Ej: ¿qué comer antes de entrenar?'}
                style={{ ...inputStyle(), borderRadius: 999, flex: 1 }}
              />
              <button
                onClick={send}
                disabled={!canSend}
                aria-label="Enviar"
                style={{ width: 50, height: 50, flexShrink: 0, borderRadius: '50%', border: 'none', background: canSend ? GRADIENT : C.inset, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="send" size={18} color={canSend ? C.onPrimary : C.textLow} />
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: sans }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '11px 15px', whiteSpace: 'pre-wrap',
                  borderRadius: m.role === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                  background: m.role === 'user' ? GRADIENT : C.inset,
                  color: m.role === 'user' ? C.onPrimary : C.text,
                  fontSize: 15, lineHeight: 1.55,
                }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ padding: '11px 15px', background: C.inset, borderRadius: '20px 20px 20px 6px', width: 'fit-content', color: C.textMid, fontSize: 14 }}>
                Pensando...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </Sheet>
      )}
    </>
  );
}
