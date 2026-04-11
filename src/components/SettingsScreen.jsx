import { useState } from 'react';
import { C, mono, sans, display } from '../utils/design.js';
import { exportAll, importAll, clearAll, getApiKey, setApiKey, clearApiKey, getPlan } from '../utils/storage.js';
import Icon from './Icon.jsx';

const PLAN_SCHEMA = `{
  "id": "mi-plan-running",
  "name": "Nombre del plan",
  "description": "Descripción breve",
  "startDate": "YYYY-MM-DD",
  "weeks": [
    {
      "id": "w1",
      "weekNumber": 1,
      "label": "Semana 1",
      "isRecovery": false,
      "totalKm": 11,
      "sessions": [
        {
          "id": "w1-mon",
          "dayName": "Lun",
          "date": "YYYY-MM-DD",
          "type": "gym",
          "title": "Piernas y core",
          "subtitle": "30 min",
          "color": "#3B82F6",
          "exercises": [
            {
              "name": "Sentadillas",
              "sets": 3,
              "reps": "12",
              "rest": "60s",
              "notes": "Peso corporal"
            }
          ]
        },
        {
          "id": "w1-tue",
          "dayName": "Mar",
          "date": "YYYY-MM-DD",
          "type": "run",
          "title": "Carrera fácil",
          "subtitle": "5 km",
          "color": "#22C55E",
          "distance": "5 km",
          "pace": "7:15–7:30 /km",
          "effort": "Fácil",
          "blocks": [
            { "name": "Calentamiento", "duration": "5 min", "description": "Caminata suave" },
            { "name": "Carrera continua", "duration": "~36 min", "description": "Ritmo conversacional" },
            { "name": "Vuelta a la calma", "duration": "5 min", "description": "Estiramientos" }
          ],
          "notes": "Primera semana: el objetivo es terminar."
        },
        {
          "id": "w1-sun",
          "dayName": "Dom",
          "date": "YYYY-MM-DD",
          "type": "rest",
          "title": "Descanso",
          "color": "#1a2235"
        }
      ]
    }
  ]
}`;

function buildPrompt(restrictions, goal, startDate, weeks) {
  return `Genera un plan de entrenamiento en formato JSON estricto para importar en mi app fitness.

DATOS PERSONALES:
- Restricciones físicas: ${restrictions || 'ninguna'}
- Objetivo: ${goal || 'completar una carrera'}
- Fecha de inicio del plan: ${startDate || new Date().toISOString().split('T')[0]}
- Número de semanas: ${weeks || 8}

ESTRUCTURA SEMANAL:
- Lunes: gym (piernas y core)
- Martes: gym mañana (tren superior) + carrera tarde
- Miércoles: gym (cuerpo entero)
- Jueves: gym mañana (cuerpo entero) + carrera tarde
- Viernes: gym (tren superior + core)
- Sábado: carrera larga
- Domingo: descanso
- Cada 4ª semana: semana de recuperación (volumen -30%)

COLORES A USAR:
- gym: "#3B82F6"
- carrera fácil: "#22C55E"
- tempo/intervalos: "#F59E0B"
- carrera larga: "#A855F7"
- descanso: "#1a2235"

El JSON debe seguir EXACTAMENTE este formato (no modifiques la estructura):
${PLAN_SCHEMA}

Genera el JSON completo para las ${weeks || 8} semanas empezando el ${startDate || new Date().toISOString().split('T')[0]}.
Incluye todos los ejercicios detallados. No trunces el output.`;
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, accent = C.blue, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, color: accent, letterSpacing: '0.15em', fontFamily: mono, marginBottom: 12, paddingLeft: 4 }}>{title}</div>
      <div style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ icon, iconColor, label, sublabel, right, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'none', border: 'none', borderBottom: `1px solid ${C.border}`, cursor: onClick ? 'pointer' : 'default', textAlign: 'left' }}
    >
      {icon && (
        <div style={{ width: 34, height: 34, borderRadius: 9, background: (iconColor || C.blue) + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={icon} size={16} color={iconColor || C.blue} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: danger ? C.red : C.text, fontWeight: 500 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: C.textLow, marginTop: 2 }}>{sublabel}</div>}
      </div>
      {right && <div style={{ fontSize: 12, color: C.textMid, fontFamily: mono, flexShrink: 0 }}>{right}</div>}
      {onClick && !right && <Icon name="chevron" size={14} color={C.textLow} />}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SettingsScreen({ onBack }) {
  const [apiKey, setApiKeyState] = useState(() => getApiKey());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [promptRestrictions, setPromptRestrictions] = useState('');
  const [promptGoal, setPromptGoal] = useState('');
  const [promptStartDate, setPromptStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [promptWeeks, setPromptWeeks] = useState('8');
  const [promptCopied, setPromptCopied] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleExportAll = () => {
    const json = JSON.stringify(exportAll(), null, 2);
    navigator.clipboard?.writeText(json).then(() => { setExportCopied(true); showToast('✓ Datos copiados al portapapeles'); setTimeout(() => setExportCopied(false), 2000); }).catch(() => showToast('No se pudo copiar automáticamente'));
  };

  const handleDownloadAll = () => {
    const json = JSON.stringify(exportAll(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthyapp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Archivo descargado');
  };

  const handleImportAll = () => {
    try {
      const parsed = JSON.parse(importText);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) { showToast('Formato inválido'); return; }
      importAll(parsed);
      setShowImport(false);
      setImportText('');
      showToast('✓ Datos restaurados. Recarga la app.');
    } catch { showToast('JSON inválido'); }
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setApiKeyState(apiKeyInput.trim());
      setApiKeyInput('');
      setShowApiInput(false);
      showToast('✓ API key guardada');
    }
  };

  const handleClearApiKey = () => {
    clearApiKey();
    setApiKeyState('');
    showToast('API key eliminada');
  };

  const handleForceUpdate = async () => {
    showToast('Borrando caché...');
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
    window.location.reload(true);
  };

  const prompt = buildPrompt(promptRestrictions, promptGoal, promptStartDate, promptWeeks);

  const copyPrompt = () => {
    navigator.clipboard?.writeText(prompt).then(() => { setPromptCopied(true); showToast('✓ Prompt copiado'); setTimeout(() => setPromptCopied(false), 2000); }).catch(() => showToast('No se pudo copiar'));
  };

  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: C.text, fontFamily: mono, fontSize: 12, outline: 'none', width: '100%' };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.bg, color: C.text, fontFamily: sans, maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '20px 20px 16px', background: C.bg, borderBottom: `1px solid ${C.surface}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="back" size={16} color={C.textMid} />
          </button>
          <div>
            <div style={{ fontSize: 10, color: C.textLow, letterSpacing: '0.15em', fontFamily: mono }}>CONFIGURACIÓN</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: display, lineHeight: 1.1 }}>Ajustes</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ padding: '20px 16px 60px' }}>

        {/* Backup */}
        <Section title="BACKUP Y RESTAURACIÓN" accent={C.blue}>
          <Row icon="download" iconColor={C.blue} label="Exportar todo" sublabel="Copia plan + entrenos + pesos al portapapeles" onClick={handleExportAll} right={exportCopied ? '✓' : undefined} />
          <Row icon="download" iconColor={C.blue} label="Descargar como archivo" sublabel="Descarga un .json con todos tus datos" onClick={handleDownloadAll} />
          <Row icon="upload" iconColor={C.amber} label="Restaurar datos" sublabel="Importa un backup completo" onClick={() => setShowImport(true)} />
          <Row icon="trash" iconColor={C.red} label="Borrar todos los datos" sublabel="Elimina plan, entrenos y pesos" onClick={() => setConfirmClear(true)} danger />
        </Section>

        {/* AI Key */}
        <Section title="ASISTENTE IA" accent={C.purple}>
          {apiKey ? (
            <>
              <Row icon="key" iconColor={C.green} label="API Key configurada" sublabel={`sk-...${apiKey.slice(-8)}`} right="Activa" />
              <Row icon="edit" iconColor={C.blue} label="Cambiar API key" onClick={() => setShowApiInput(p => !p)} />
              <Row icon="trash" iconColor={C.red} label="Eliminar API key" onClick={handleClearApiKey} danger />
            </>
          ) : (
            <Row icon="key" iconColor={C.amber} label="Configurar API key" sublabel="Necesaria para el asistente IA" onClick={() => setShowApiInput(p => !p)} />
          )}
          {showApiInput && (
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.textMid, fontFamily: mono, marginBottom: 8, lineHeight: 1.6 }}>
                Obtén tu clave en console.anthropic.com. Se guarda solo en tu dispositivo.
              </div>
              <input type="password" placeholder="sk-ant-..." value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveApiKey()} style={{ ...inp, marginBottom: 8 }} />
              <button onClick={handleSaveApiKey} style={{ width: '100%', padding: 10, background: C.purple, color: '#fff', border: 'none', borderRadius: 8, fontFamily: mono, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Guardar clave</button>
            </div>
          )}
        </Section>

        {/* Plan Prompt */}
        <Section title="GENERA TU PLAN CON CLAUDE" accent={C.lime}>
          <div style={{ padding: '0 0 0 0' }}>
            <Row icon="sparkle" iconColor={C.lime} label="Prompt para generar tu plan" sublabel="Personaliza y copia para usarlo en Claude" onClick={() => setShowPromptEditor(p => !p)} right={showPromptEditor ? '▲' : '▼'} />
            {showPromptEditor && (
              <div style={{ padding: '16px 18px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 5 }}>RESTRICCIONES FÍSICAS</div>
                    <input style={inp} value={promptRestrictions} onChange={e => setPromptRestrictions(e.target.value)} placeholder="ej: L5-S1: sin carga axial" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 5 }}>OBJETIVO</div>
                    <input style={inp} value={promptGoal} onChange={e => setPromptGoal(e.target.value)} placeholder="ej: Media maratón Abril 2027" />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 5 }}>FECHA INICIO</div>
                      <input type="date" style={{ ...inp }} value={promptStartDate} onChange={e => setPromptStartDate(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 5 }}>SEMANAS</div>
                      <input type="number" style={inp} value={promptWeeks} onChange={e => setPromptWeeks(e.target.value)} min="1" max="52" />
                    </div>
                  </div>
                </div>

                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: C.textLow, fontFamily: mono, marginBottom: 6 }}>PROMPT GENERADO</div>
                  <div style={{ fontSize: 11, color: C.textMid, fontFamily: mono, lineHeight: 1.7, maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {prompt.slice(0, 400)}...
                  </div>
                </div>

                <button onClick={copyPrompt} style={{ width: '100%', padding: 12, background: promptCopied ? C.greenDeep : C.lime, color: promptCopied ? '#fff' : '#0e0e11', border: 'none', borderRadius: 10, fontFamily: mono, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon name="copy" size={15} color={promptCopied ? '#fff' : '#0e0e11'} />
                  {promptCopied ? '✓ Prompt copiado' : 'Copiar prompt completo'}
                </button>

                <div style={{ fontSize: 11, color: C.textLow, fontFamily: mono, marginTop: 10, lineHeight: 1.6, textAlign: 'center' }}>
                  Pégalo en Claude → copia el JSON que te dé → ve a Entrenos → Importar plan
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Plan info */}
        {getPlan() && (
          <Section title="PLAN ACTIVO" accent={C.blue}>
            <Row icon="run" iconColor={C.blue} label={getPlan()?.name || 'Plan sin nombre'} sublabel={`${getPlan()?.weeks?.length || 0} semanas · Inicio: ${getPlan()?.startDate || '—'}`} />
          </Section>
        )}

        {/* Version & Update */}
        <Section title="VERSIÓN Y ACTUALIZACIÓN" accent={C.textMid}>
          <Row icon="refresh" iconColor={C.blue} label="Forzar actualización" sublabel="Borra la caché y recarga la última versión" onClick={handleForceUpdate} />
        </Section>

        <div style={{ fontSize: 11, color: C.textLow, fontFamily: mono, textAlign: 'center', lineHeight: 1.7, padding: '8px 0' }}>
          HealthyApp · v{typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '—'} · Datos guardados en tu dispositivo
        </div>
      </div>
      </div>

      {/* Import modal */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowImport(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 18, width: '100%', maxWidth: 480, padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: display, marginBottom: 6 }}>Restaurar datos</div>
            <div style={{ fontSize: 12, color: C.textMid, fontFamily: mono, marginBottom: 12, lineHeight: 1.6 }}>Pega el JSON exportado con exportAll. Reemplaza todos los datos actuales.</div>
            <textarea placeholder='{ "plan": ..., "completed": ..., "weight": ... }' value={importText} onChange={e => setImportText(e.target.value)} rows={8} style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, color: C.text, fontFamily: mono, fontSize: 11, outline: 'none', resize: 'none' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={handleImportAll} style={{ flex: 1, padding: 11, background: C.blue, color: '#fff', border: 'none', borderRadius: 8, fontFamily: mono, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Restaurar</button>
              <button onClick={() => setShowImport(false)} style={{ flex: 1, padding: 11, background: C.surfaceHigh, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: mono, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm clear */}
      {confirmClear && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setConfirmClear(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.surfaceHigh, border: `1px solid ${C.red}44`, borderRadius: 18, width: '100%', maxWidth: 400, padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: display, marginBottom: 8 }}>¿Borrar todo?</div>
            <div style={{ fontSize: 13, color: C.textMid, marginBottom: 20, lineHeight: 1.6 }}>Se eliminarán el plan, todos los entrenos marcados y todos los registros de peso. Esta acción no se puede deshacer.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { clearAll(); setConfirmClear(false); showToast('✓ Datos eliminados. Recarga la app.'); }} style={{ flex: 1, padding: 12, background: C.red, color: '#fff', border: 'none', borderRadius: 10, fontFamily: display, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Sí, borrar todo</button>
              <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: 12, background: C.surfaceHigh, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: mono, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', fontSize: 13, color: C.text, fontFamily: mono, zIndex: 500, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
