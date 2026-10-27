# Backlog

Ideas y tareas pendientes que quedaron fuera del rediseño visual "Kora" (que solo cambió el aspecto, no las funciones).

## Funciones nuevas
- **Racha de entrenos:** contador de días seguidos sin fallar un entreno, mostrado en el Inicio. Salió en la propuesta B del rediseño y se dejó fuera a propósito.

## Marca
- **Nombre definitivo:** "Kora" es provisional. Antes de publicar, comprobar marca registrada, disponibilidad en App Store / Google Play y dominio, o elegir otro nombre. Cambiarlo es tocar `APP_NAME` en `src/utils/design.js`, `index.html` y el manifest de `vite.config.js`.

## Lanzamiento con usuarios externos
- **Correo propio para el login** (Resend, SendGrid…): el correo de Supabase solo envía unos pocos emails por hora.
- **IA en el servidor:** que la app llame a la IA con una clave propia (por ejemplo una Edge Function de Supabase), generar el plan dentro de la app y poner límites de uso por usuario.
- **Legal (RGPD):** consentimiento para datos de salud, política de privacidad, términos y aviso médico; borrar la cuenta desde la app.
- **Fiabilidad:** las escrituras a Supabase no comprueban errores; añadir control de errores y una cola de reintentos sin conexión.
- **Tiendas:** envolver la app con Capacitor para iOS y Android.
