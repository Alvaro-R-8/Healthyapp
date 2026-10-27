import { useState } from 'react';
import { C, APP_NAME } from '../utils/design.js';
import { exportAll, importAll, clearAll, getApiKey, setApiKey, clearApiKey, getPlan } from '../utils/storage.js';
import { Screen, ScreenHeader, Section, Row, Button, Segmented, Sheet, Toast, Field, inputStyle } from './ui.jsx';

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
          "color": "#A78BFA",
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
          "color": "#5EEAD4",
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
          "color": "#9C8590"
        }
      ]
    }
  ]
}`;

function buildPrompt({ goal, level, days, restrictions, startDate, weeks }) {
  const start = startDate || new Date().toISOString().split('T')[0];
  const nWeeks = weeks || 8;
  return `Eres un entrenador personal experto. Diseña un plan de entrenamiento personalizado y devuélvelo en formato JSON estricto para importarlo en mi app fitness.

OBJETIVO PRINCIPAL (todo el plan debe estar orientado a conseguirlo):
${goal || 'mejorar mi forma física general'}

DATOS PERSONALES:
- Nivel / forma actual: ${level || 'no especificado'}
- Días disponibles para entrenar por semana: ${days || 'los que consideres adecuados'}
- Restricciones físicas o lesiones: ${restrictions || 'ninguna'}
- Fecha de inicio del plan: ${start}
- Número de semanas: ${nWeeks}

CÓMO DISEÑAR EL PLAN:
- Elige tú la estructura semanal, el reparto entre fuerza (gym) y carrera, y los días de descanso en función del objetivo, mi nivel y los días disponibles.
- Progresa la carga de forma gradual y realista hacia el objetivo, e incluye semanas de recuperación (volumen reducido) cuando tenga sentido.
- Si el objetivo tiene una fecha (por ejemplo una carrera), planifica la puesta a punto para llegar en el mejor momento.
- Respeta siempre las restricciones físicas indicadas.
- Usa en la "description" del plan un resumen de 1-2 frases de cómo el plan lleva al objetivo.

TIPOS DE SESIÓN ("type"): "gym", "run", "rest" y, solo si encajan con el objetivo o los pido, "swim" (natación), "bike" (ciclismo), "walk" (andar), "treadmill" (andar en cinta), "pilates", "yoga", "stretch" (estiramientos/movilidad) u "other" (cualquier otra actividad). En las sesiones de distancia (run, swim, bike, walk, treadmill) rellena "distance" y "pace". Cada día de cada semana debe tener al menos una sesión (los días sin entreno son "rest"). Si un día tiene dos entrenos, crea dos sesiones con la misma fecha e ids distintos.

COLORES A USAR:
- gym: "#A78BFA"
- carrera fácil: "#5EEAD4"
- tempo/intervalos: "#FFB547"
- carrera larga: "#FF5E7E"
- natación: "#38BDF8"
- ciclismo: "#A3E635"
- andar / andar en cinta: "#86EFAC"
- pilates / yoga / estiramientos: "#F0ABFC"
- otros: "#CBD5E1"
- descanso: "#9C8590"

El JSON debe seguir EXACTAMENTE este formato (no modifiques la estructura):
${PLAN_SCHEMA}

Genera el JSON completo para las ${nWeeks} semanas empezando el ${start}.
Incluye todos los ejercicios detallados. Devuelve solo el JSON, sin texto adicional. No trunces el output.`;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SettingsScreen({ userEmail, onSignOut, themePref, onThemeChange }) {
  const [apiKey, setApiKeyState] = useState(() => getApiKey());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [promptRestrictions, setPromptRestrictions] = useState('');
  const [promptGoal, setPromptGoal] = useState('');
  const [promptLevel, setPromptLevel] = useState('');
  const [promptDays, setPromptDays] = useState('');
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
    a.download = `${APP_NAME.toLowerCase()}-backup-${new Date().toISOString().split('T')[0]}.json`;
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

  const prompt = buildPrompt({ goal: promptGoal, level: promptLevel, days: promptDays, restrictions: promptRestrictions, startDate: promptStartDate, weeks: promptWeeks });

  const copyPrompt = () => {
    navigator.clipboard?.writeText(prompt).then(() => { setPromptCopied(true); showToast('✓ Prompt copiado'); setTimeout(() => setPromptCopied(false), 2000); }).catch(() => showToast('No se pudo copiar'));
  };

  const inp = inputStyle();
  const plan = getPlan();

  return (
    <Screen>
      <ScreenHeader title="Ajustes" />

      <Section title="Apariencia">
        <div style={{ padding: 14 }}>
          <Segmented
            options={[
              { value: 'system', label: 'Sistema', icon: 'monitor' },
              { value: 'light', label: 'Claro', icon: 'sun' },
              { value: 'dark', label: 'Oscuro', icon: 'rest' },
            ]}
            value={themePref}
            onChange={onThemeChange}
          />
        </div>
      </Section>

      {userEmail && (
        <Section title="Cuenta">
          <Row icon="key" iconColor={C.success} label={userEmail} sublabel="Sesión iniciada · datos en la nube" />
          <Row icon="close" iconColor={C.danger} label="Cerrar sesión" onClick={onSignOut} danger last />
        </Section>
      )}

      <Section title="Genera tu plan con Claude">
        <Row icon="sparkle" iconColor={C.primary} label="Prompt para generar tu plan" sublabel="Personaliza y copia para usarlo en Claude" onClick={() => setShowPromptEditor(p => !p)} right={showPromptEditor ? '▲' : '▼'} last={!showPromptEditor} />
        {showPromptEditor && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Objetivo">
              <textarea style={{ ...inp, resize: 'none' }} rows={3} value={promptGoal} onChange={e => setPromptGoal(e.target.value)} placeholder="ej: Correr una media maratón en abril de 2027 por debajo de 2h y perder 5 kg" />
            </Field>
            <Field label="Nivel actual">
              <input style={inp} value={promptLevel} onChange={e => setPromptLevel(e.target.value)} placeholder="ej: corro 5 km en 30 min, gym 2 días/semana" />
            </Field>
            <Field label="Restricciones físicas">
              <input style={inp} value={promptRestrictions} onChange={e => setPromptRestrictions(e.target.value)} placeholder="ej: molestias de rodilla, sin saltos" />
            </Field>
            <Field label="Fecha de inicio">
              <input type="date" style={inp} value={promptStartDate} onChange={e => setPromptStartDate(e.target.value)} />
            </Field>
            <div style={{ display: 'flex', gap: 10 }}>
              <Field label="Semanas" style={{ flex: 1 }}>
                <input type="number" style={inp} value={promptWeeks} onChange={e => setPromptWeeks(e.target.value)} min="1" max="52" />
              </Field>
              <Field label="Días por semana" style={{ flex: 1 }}>
                <input type="number" style={inp} value={promptDays} onChange={e => setPromptDays(e.target.value)} min="1" max="7" placeholder="—" />
              </Field>
            </div>
            {/* Long plans tend to come back truncated from the model. */}
            {Number(promptWeeks) > 16 ? (
              <div role="status" style={{ fontSize: 13, color: C.secondary, lineHeight: 1.5, marginTop: -4 }}>
                Más de 16 semanas: el plan puede salir cortado. Mejor pide bloques de hasta 16 semanas y, al terminar uno, genera el siguiente.
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5, marginTop: -4 }}>
                Recomendado: hasta 16 semanas por plan.
              </div>
            )}

            <div style={{ background: C.inset, borderRadius: 18, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textMid, marginBottom: 6 }}>Vista previa del prompt</div>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {prompt.slice(0, 400)}...
              </div>
            </div>

            <Button variant={promptCopied ? 'success' : 'primary'} icon="copy" onClick={copyPrompt}>
              {promptCopied ? '✓ Prompt copiado' : 'Copiar prompt completo'}
            </Button>

            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, textAlign: 'center' }}>
              Pégalo en Claude → copia el JSON que te dé → Entrenos → Importar plan
            </div>
          </div>
        )}
      </Section>

      {plan && (
        <Section title="Plan activo">
          <Row icon="run" iconColor={C.success} label={plan.name || 'Plan sin nombre'} sublabel={`${plan.weeks?.length || 0} semanas · Inicio: ${plan.startDate || '—'}`} last />
        </Section>
      )}

      <Section title="Asistente IA">
        {apiKey ? (
          <>
            <Row icon="key" iconColor={C.success} label="API key configurada" sublabel={`sk-...${apiKey.slice(-8)}`} right="Activa" />
            <Row icon="edit" iconColor={C.accent} label="Cambiar API key" onClick={() => setShowApiInput(p => !p)} />
            <Row icon="trash" iconColor={C.danger} label="Eliminar API key" onClick={handleClearApiKey} danger last={!showApiInput} />
          </>
        ) : (
          <Row icon="key" iconColor={C.secondary} label="Configurar API key" sublabel="Necesaria para el asistente IA" onClick={() => setShowApiInput(p => !p)} last={!showApiInput} />
        )}
        {showApiInput && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.55 }}>
              Obtén tu clave en console.anthropic.com. Se guarda solo en tu dispositivo.
            </div>
            <input type="password" aria-label="API key" placeholder="sk-ant-..." value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveApiKey()} style={inp} />
            <Button onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()}>Guardar clave</Button>
          </div>
        )}
      </Section>

      <Section title="Backup y restauración">
        <Row icon="copy" iconColor={C.accent} label="Exportar todo" sublabel="Copia plan, entrenos y pesos al portapapeles" onClick={handleExportAll} right={exportCopied ? '✓' : undefined} />
        <Row icon="download" iconColor={C.accent} label="Descargar como archivo" sublabel="Descarga un .json con todos tus datos" onClick={handleDownloadAll} />
        <Row icon="upload" iconColor={C.secondary} label="Restaurar datos" sublabel="Importa un backup completo" onClick={() => setShowImport(true)} />
        <Row icon="trash" iconColor={C.danger} label="Borrar todos los datos" sublabel="Elimina plan, entrenos y pesos" onClick={() => setConfirmClear(true)} danger last />
      </Section>

      <Section title="Versión y actualización">
        <Row icon="refresh" iconColor={C.accent} label="Forzar actualización" sublabel="Borra la caché y recarga la última versión" onClick={handleForceUpdate} last />
      </Section>

      <div style={{ fontSize: 13, color: C.textMid, textAlign: 'center', lineHeight: 1.7, padding: '4px 0' }}>
        {APP_NAME} · v{typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '—'} · {typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : ''}
      </div>

      {showImport && (
        <Sheet title="Restaurar datos" onClose={() => setShowImport(false)} footer={<Button onClick={handleImportAll} disabled={!importText.trim()}>Restaurar</Button>}>
          <div style={{ fontSize: 15, color: C.textMid, marginBottom: 12, lineHeight: 1.55 }}>Pega el JSON de «Exportar todo». Reemplaza todos los datos actuales.</div>
          <textarea aria-label="JSON del backup" placeholder='{ "plan": ..., "completed": ..., "weight": ... }' value={importText} onChange={e => setImportText(e.target.value)} rows={8} style={{ ...inp, fontSize: 12, fontFamily: 'ui-monospace, Menlo, monospace', resize: 'none' }} />
        </Sheet>
      )}

      {confirmClear && (
        <Sheet
          title="¿Borrar todo?"
          onClose={() => setConfirmClear(false)}
          footer={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button variant="danger" onClick={() => { clearAll(); setConfirmClear(false); showToast('✓ Datos eliminados. Recarga la app.'); }}>Sí, borrar todo</Button>
              <Button variant="glass" onClick={() => setConfirmClear(false)}>Cancelar</Button>
            </div>
          }
        >
          <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.6 }}>Se eliminarán el plan, todos los entrenos marcados y todos los registros de peso. Esta acción no se puede deshacer.</div>
        </Sheet>
      )}

      {toast && <Toast>{toast}</Toast>}
    </Screen>
  );
}
