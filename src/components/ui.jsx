import { createPortal } from 'react-dom';
import { C, GRADIENT, display, sans, APP_NAME } from '../utils/design.js';
import Icon from './Icon.jsx';

// ── Surfaces ─────────────────────────────────────────────────────────────────
export function GlassCard({ children, style, radius = 26, padding = 18, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: radius, padding, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Label({ children, color, style }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: color || C.textMid, textTransform: 'uppercase', ...style }}>
      {children}
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────
export function Button({ variant = 'primary', icon, children, style, disabled, full = true, ...rest }) {
  const base = {
    height: 52, padding: '0 20px', borderRadius: 999, border: 'none',
    fontFamily: sans, fontSize: 16, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: full ? '100%' : undefined, cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.45 : 1,
  };
  const variants = {
    primary: { background: GRADIENT, color: C.onPrimary },
    dark: { background: C.onPrimary, color: '#FFF5F2' },
    glass: { background: C.glassStrong, color: C.text, border: `1px solid ${C.glassBorder}` },
    danger: { background: C.danger, color: '#FFFFFF' },
    success: { background: C.success, color: C.mode === 'light' ? '#FFFFFF' : '#0B2E2A' },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button disabled={disabled} style={{ ...base, ...v, ...style }} {...rest}>
      {icon && <Icon name={icon} size={18} color={v.color} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, onClick, size = 44, color, style }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{ width: size, height: size, borderRadius: '50%', border: `1px solid ${C.glassBorder}`, background: C.glass, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, ...style }}
    >
      <Icon name={icon} size={20} color={color || C.textMid} />
    </button>
  );
}

export function Chip({ active, children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 40, padding: '0 16px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
        fontFamily: sans, fontSize: 14, fontWeight: active ? 700 : 600,
        border: active ? 'none' : `1px solid ${C.glassBorder}`,
        background: active ? GRADIENT : C.glass,
        color: active ? C.onPrimary : C.textMid,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, gap: 4, padding: 4, borderRadius: 999, background: C.inset }}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              height: 40, borderRadius: 999, border: 'none',
              background: on ? (C.mode === 'light' ? '#FFFFFF' : C.glassStrong) : 'transparent',
              color: on ? C.text : C.textMid, fontFamily: sans, fontSize: 14, fontWeight: on ? 700 : 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: on && C.mode === 'light' ? '0 1px 3px rgba(42,20,32,0.12)' : 'none',
            }}
          >
            {o.icon && <Icon name={o.icon} size={15} color={on ? C.text : C.textMid} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Inputs ───────────────────────────────────────────────────────────────────
export const inputStyle = () => ({
  width: '100%', background: C.mode === 'light' ? '#FFFFFF' : C.inset,
  border: `1px solid ${C.glassBorder}`, borderRadius: 16, padding: '13px 16px',
  color: C.text, fontFamily: sans, fontSize: 15, outline: 'none',
});

export function Field({ label, children, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{label}</span>
      {children}
    </label>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────
export function Screen({ children }) {
  return (
    <div style={{ minHeight: '100vh', color: C.text, fontFamily: sans, maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <div style={{ padding: 'calc(env(safe-area-inset-top) + 20px) 20px calc(env(safe-area-inset-bottom) + 120px)' }}>
        {children}
      </div>
    </div>
  );
}

export function ScreenHeader({ title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, minHeight: 48 }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ margin: 0, fontFamily: display, fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 14, color: C.textMid, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
      </div>
      {right && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

// Bottom sheet rendered in a portal so it sits above the tab bar.
export function Sheet({ title, eyebrow, onClose, children, footer, maxHeight = '88vh' }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: C.overlay, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        style={{ background: C.bgElevated, color: C.text, fontFamily: sans, borderRadius: '30px 30px 0 0', width: '100%', maxWidth: 480, maxHeight, display: 'flex', flexDirection: 'column', border: `1px solid ${C.glassBorder}`, borderBottom: 'none' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 40, height: 5, background: C.line, borderRadius: 3 }} />
        </div>
        {(title || eyebrow) && (
          <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              {eyebrow && <Label color={eyebrow.color} style={{ marginBottom: 4 }}>{eyebrow.text}</Label>}
              {title && <div style={{ fontFamily: display, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{title}</div>}
            </div>
            <IconButton icon="close" label="Cerrar" onClick={onClose} size={40} />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
        {footer && <div style={{ padding: '8px 20px calc(env(safe-area-inset-bottom) + 20px)' }}>{footer}</div>}
        {!footer && <div style={{ height: 'calc(env(safe-area-inset-bottom) + 12px)' }} />}
      </div>
    </div>,
    document.body
  );
}

export function Toast({ children }) {
  return (
    <div role="status" style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 112px)', left: '50%', transform: 'translateX(-50%)', background: C.bgElevated, border: `1px solid ${C.glassBorder}`, borderRadius: 22, padding: '11px 20px', fontSize: 14, fontWeight: 600, color: C.text, zIndex: 500, width: 'max-content', maxWidth: 'calc(100% - 32px)', textAlign: 'center', lineHeight: 1.4, boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
      {children}
    </div>
  );
}

// ── Settings-style list ──────────────────────────────────────────────────────
export function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <Label style={{ marginBottom: 10, paddingLeft: 6 }}>{title}</Label>
      <div style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 24, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

export function Row({ icon, iconColor, label, sublabel, right, onClick, danger, last }) {
  const color = iconColor || C.accent;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', borderBottom: last ? 'none' : `1px solid ${C.glassBorder}`, textAlign: 'left', color: C.text, fontFamily: sans }}
    >
      {icon && (
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={icon} size={18} color={color} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, color: danger ? C.dangerText : C.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 13, color: C.textMid, marginTop: 2 }}>{sublabel}</div>}
      </div>
      {right && <div style={{ fontSize: 13, color: C.textMid, fontWeight: 600, flexShrink: 0 }}>{right}</div>}
      {onClick && !right && <Icon name="chevron" size={16} color={C.textLow} />}
    </Tag>
  );
}

// ── Brand ────────────────────────────────────────────────────────────────────
export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id="koraMark" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF5E7E" />
          <stop offset="1" stopColor="#FFB547" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="114" fill="url(#koraMark)" />
      <path d="M196 118 V330 M196 240 L330 118 M240 200 L334 330" stroke="#2A0A14" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M118 404 H198 L224 370 L254 432 L284 360 L310 404 H394" stroke="#2A0A14" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
    </svg>
  );
}

export function Logo({ size = 34 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} />
      <div style={{ fontFamily: display, fontSize: Math.round(size * 0.62), fontWeight: 800, color: C.text }}>{APP_NAME}</div>
    </div>
  );
}

// ── Progress ring ────────────────────────────────────────────────────────────
export function Ring({ size = 56, stroke = 7, value = 0, color, track, children, label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const gid = `ring${size}${stroke}`;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF5E7E" />
            <stop offset="1" stopColor="#FFB547" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track || C.inset} strokeWidth={stroke} />
        {v > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color || `url(#${gid})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circ * v} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  );
}
