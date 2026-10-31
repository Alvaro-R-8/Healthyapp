import { useState } from 'react';
import { C, display, sans, APP_NAME } from '../utils/design.js';
import { addWeightEntry, setGoalWeight } from '../utils/storage.js';
import { localToday } from '../utils/dateUtils.js';
import Icon from './Icon.jsx';
import { GlassCard, Button, Field, LogoMark, inputStyle } from './ui.jsx';

const parseKg = (text) => {
  const v = parseFloat(String(text).replace(',', '.'));
  return !isNaN(v) && v >= 30 && v <= 300 ? v : null;
};

// First-run welcome for an account with no plan, weights or goal: asks for
// the current weight and goal (both optional) and explains how to get a plan.
export default function Onboarding({ onDone }) {
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');

  const finish = () => {
    const w = weight.trim() ? parseKg(weight) : null;
    const g = goal.trim() ? parseKg(goal) : null;
    if ((weight.trim() && w == null) || (goal.trim() && g == null)) {
      setError('Escribe un peso entre 30 y 300 kg, o déjalo en blanco.');
      return;
    }
    if (w != null) addWeightEntry({ date: localToday(), weight: w, type: 'official', note: '' });
    if (g != null) setGoalWeight(g);
    onDone();
  };

  const inp = { ...inputStyle(), fontSize: 20, fontWeight: 800 };
  const steps = [
    { icon: 'sliders', text: 'En Ajustes, rellena tu objetivo y copia el prompt para generar tu plan.' },
    { icon: 'sparkle', text: 'Pégalo en Claude y copia el plan que te devuelva.' },
    { icon: 'download', text: 'En Entrenos, pulsa importar y pégalo. ¡Listo!' },
  ];

  return (
    <div style={{ minHeight: '100vh', color: C.text, fontFamily: sans, display: 'flex', justifyContent: 'center', padding: 'calc(env(safe-area-inset-top) + 28px) 20px 32px' }}>
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <LogoMark size={52} />
          <h1 style={{ margin: 0, fontFamily: display, fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>Te damos la bienvenida a {APP_NAME}</h1>
          <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.55 }}>Dos datos para empezar. Puedes dejarlos en blanco y añadirlos luego en Peso.</div>
        </div>

        <GlassCard radius={28} padding={18} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Peso actual (kg)" style={{ flex: 1 }}>
              <input type="text" inputMode="decimal" placeholder="80,0" value={weight} onChange={e => { setWeight(e.target.value); setError(''); }} style={inp} />
            </Field>
            <Field label="Tu meta (kg)" style={{ flex: 1 }}>
              <input type="text" inputMode="decimal" placeholder="75,0" value={goal} onChange={e => { setGoal(e.target.value); setError(''); }} style={inp} />
            </Field>
          </div>
          {error && <div role="status" style={{ fontSize: 14, color: C.dangerText }}>{error}</div>}
        </GlassCard>

        <GlassCard radius={28} padding={18} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: display, fontSize: 18, fontWeight: 800 }}>Tu plan de entrenamiento</div>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.primary + '26', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={s.icon} size={17} color={C.primaryText} />
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.5, paddingTop: 6 }}>{s.text}</div>
            </div>
          ))}
        </GlassCard>

        <Button onClick={finish}>Empezar</Button>
        <button onClick={onDone} style={{ padding: 8, background: 'none', border: 'none', color: C.textMid, fontSize: 14, fontWeight: 600 }}>
          Saltar por ahora
        </button>
      </div>
    </div>
  );
}
