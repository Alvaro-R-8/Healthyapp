import { useState, useEffect, useRef } from 'react';
import { C, mono, sans, display } from '../utils/design.js';
import { getApiKey, setApiKey } from '../utils/storage.js';
import Icon from './Icon.jsx';

export default function AiChat({ mode, context }) {
  const [open, setOpen] = useState(false);
  const [keyPrompt, setKeyPrompt] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [msgs, setMsgs] = useState([{
    role: 'assistant',
    text: mode === 'training'
      ? 'Hola 👋 Dime si necesitas ajustar algo del plan — una semana de viaje, una sesión cancelada, o si el volumen se siente alto.'
      : 'Hola 👋 Puedo ayudarte con tus datos de peso, estrategia de déficit, nutrición, o lo que necesites.',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const accentColor = mode === 'training' ? C.blue : C.lime;

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

  const sheet = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 60,
    display: 'flex', alignItems: 'flex-end',
  };
  const panel = {
    width: '100%', maxWidth: 480, margin: '0 auto',
    background: C.bg, borderRadius: '20px 20px 0 0',
    maxHeight: '75vh', display: 'flex', flexDirection: 'column',
    border: `1px solid ${C.border}`, borderBottom: 'none',
  };

  return (
    <>
      <button
        onClick={openChat}
        style={{
          position: 'fixed', bottom: 24, right: 20, width: 52, height: 52,
          background: mode === 'training' ? C.blueDeep : '#1a2e00',
          border: `1.5px solid ${accentColor}`,
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: `0 4px 20px ${mode === 'training' ? 'rgba(37,99,235,0.4)' : 'rgba(200,240,96,0.2)'}`,
          zIndex: 50,
        }}
      >
        <Icon name="chat" size={22} color={accentColor} />
      </button>

      {keyPrompt && (
        <div style={sheet} onClick={() => setKeyPrompt(false)}>
          <div onClick={e => e.stopPropagation()} style={{ ...panel, padding: '24px 20px 32px' }}>
            <div style={{ fontSize: 10, color: accentColor, fontFamily: mono, letterSpacing: '0.12em', marginBottom: 8 }}>ASISTENTE IA</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: display, marginBottom: 6 }}>API Key de Anthropic</div>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 16 }}>
              Para usar el asistente IA necesitas una API key de Anthropic. Se guarda solo en tu dispositivo.
            </div>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              style={{
                width: '100%', background: C.surfaceHigh, border: `1px solid ${C.borderHigh}`,
                borderRadius: 10, padding: '12px 14px', color: C.text,
                fontFamily: mono, fontSize: 13, outline: 'none', marginBottom: 12,
              }}
            />
            <button
              onClick={saveKey}
              style={{
                width: '100%', padding: 12, background: accentColor,
                color: '#000', border: 'none', borderRadius: 10,
                fontFamily: mono, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Guardar y continuar
            </button>
          </div>
        </div>
      )}

      {open && (
        <div style={sheet} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={panel}>
            <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: accentColor, fontFamily: mono, letterSpacing: '0.12em', marginBottom: 2 }}>
                  {mode === 'training' ? 'ENTRENADOR IA' : 'COACH NUTRICIÓN IA'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: display }}>
                  {mode === 'training' ? 'Ajusta tu plan' : 'Nutrición & peso'}
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="close" size={15} color={C.textMid} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: m.role === 'user' ? C.blueDeep : C.surfaceHigh,
                    fontSize: 13, lineHeight: 1.6, color: C.text,
                    border: m.role === 'assistant' ? `1px solid ${C.border}` : 'none',
                  }}>{m.text}</div>
                </div>
              ))}
              {loading && (
                <div style={{ padding: '10px 14px', background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: '14px 14px 14px 4px', width: 'fit-content', color: accentColor, fontSize: 12, fontFamily: mono }}>
                  Pensando...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '10px 16px 28px', display: 'flex', gap: 8, borderTop: `1px solid ${C.border}` }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={mode === 'training' ? 'Ej: el jueves no pude correr...' : 'Ej: ¿qué comer antes de entrenar?'}
                style={{ flex: 1, background: C.surfaceHigh, border: `1px solid ${C.borderHigh}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, outline: 'none', fontFamily: sans }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                style={{
                  background: loading || !input.trim() ? C.surfaceHigh : accentColor,
                  border: 'none', borderRadius: 10, width: 42,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <Icon name="send" size={15} color={loading || !input.trim() ? C.textLow : '#000'} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
