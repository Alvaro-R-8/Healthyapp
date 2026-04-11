import { C, mono, sans, display } from '../utils/design.js';
import Icon from './Icon.jsx';

export default function Home({ onNavigate }) {
  const card = (onClick, accent, iconName, title, subtitle, cta) => (
    <button
      onClick={onClick}
      style={{
        background: C.surfaceHigh, border: `1px solid ${C.borderHigh}`,
        borderRadius: 22, padding: '24px', cursor: 'pointer',
        textAlign: 'left', position: 'relative', overflow: 'hidden', width: '100%',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 140, height: 140,
        background: `radial-gradient(circle at 100% 0%, ${accent}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: accent + '1a', border: `1px solid ${accent}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
      }}>
        <Icon name={iconName} size={22} color={accent} />
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, fontFamily: display, color: C.text, marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.textMid, marginBottom: 18, lineHeight: 1.5 }}>{subtitle}</div>
      <div style={{ fontSize: 11, color: accent, fontFamily: mono, letterSpacing: '0.08em' }}>{cta} →</div>
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: sans, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: 'calc(env(safe-area-inset-top) + 56px) 24px 0' }}>
        <div style={{ fontSize: 10, color: C.blue, letterSpacing: '0.2em', fontFamily: mono, marginBottom: 8 }}>
          HEALTHYAPP
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, fontFamily: display, lineHeight: 1.05, marginBottom: 10 }}>
          Tu app<br /><span style={{ color: C.blue }}>personal</span>
        </div>
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 48 }}>
          Entrenos dinámicos · Control de peso<br />Asistente IA integrado
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {card(
            () => onNavigate('training'),
            C.blue, 'run',
            'Mis Entrenos',
            'Plan dinámico importable desde Claude.\nGym + Running personalizados.',
            'Abrir entrenos',
          )}
          {card(
            () => onNavigate('weight'),
            C.lime, 'weight',
            'Control de Peso',
            'Seguimiento oficial y controles.\nGráfica de evolución con metas.',
            'Abrir peso',
          )}
        </div>
      </div>

      <button
        onClick={() => onNavigate('settings')}
        style={{
          position: 'fixed', top: 'calc(env(safe-area-inset-top) + 12px)', right: 20,
          background: C.surfaceHigh, border: `1px solid ${C.border}`,
          borderRadius: 10, width: 38, height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10,
        }}
      >
        <Icon name="settings" size={17} color={C.textMid} />
      </button>
    </div>
  );
}
