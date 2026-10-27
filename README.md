# Kora

App web instalable (PWA) para seguir un plan de entrenamiento y el peso. React + Vite, con datos en Supabase.

## Desarrollo local

```bash
npm install
cp .env.example .env   # y rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

`.env` no se sube al repositorio.

## Base de datos

- `supabase/schema.sql`: esquema inicial (se ejecuta una vez en un proyecto nuevo).
- `supabase/migrations/`: cambios posteriores. Cada archivo se ejecuta una vez, en orden, en Supabase → SQL Editor → New query → pegar → Run. Se pueden volver a ejecutar sin romper nada.
  - `20261027_plan_history.sql`: tabla de planes guardados («Mis planes»).

## Despliegue

Cada push a `main` construye la app y la publica en GitHub Pages (`.github/workflows/deploy.yml`). También se puede lanzar a mano desde Actions → *Deploy to GitHub Pages* → *Run workflow*.

El build necesita estos **secrets** del repositorio (Settings → Secrets and variables → Actions → *Secrets*):

| Secret | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Clave *anon public* del proyecto (Supabase → Project Settings → API) |

## Pasar a un dominio propio

Hoy la app vive en `https://<usuario>.github.io/Healthyapp/`, así que se construye con la ruta base `/Healthyapp/`. La ruta se toma de `BASE_PATH` (por defecto `/Healthyapp/`) y se usa en `vite.config.js` para `base`, `manifest.start_url` y `manifest.scope`.

1. **Ruta base:** en GitHub, Settings → Secrets and variables → Actions → *Variables*, crea la variable `BASE_PATH` con el valor `/`. En local: `BASE_PATH=/ npm run build`.
2. **Dominio en el hosting:**
   - **GitHub Pages:** crea `public/CNAME` con el dominio en una sola línea (por ejemplo `kora.app`). En Settings → Pages → *Custom domain*, escribe el mismo dominio y activa *Enforce HTTPS*. En tu proveedor del dominio, apunta el DNS a GitHub Pages: registros `A`/`AAAA` del dominio raíz a las IPs de GitHub, o un `CNAME` de `www` a `<usuario>.github.io`.
   - **Otro hosting** (Netlify, Vercel, Cloudflare Pages…): build `npm run build`, carpeta `dist`, mismas variables `VITE_SUPABASE_*` y `BASE_PATH=/`. Configura el dominio desde su panel.
3. **Supabase:** en Authentication → URL Configuration:
   - **Site URL:** `https://tu-dominio`.
   - **Redirect URLs:** añade `https://tu-dominio/**`. Mantén la URL antigua de GitHub Pages mientras convivan las dos.

   Los enlaces de acceso usan `window.location.origin + import.meta.env.BASE_URL`, así que siguen al dominio y la ruta nuevos sin tocar código.
4. **En el móvil:** la app instalada en la pantalla de inicio apunta a la URL antigua. Hay que borrarla y volver a añadirla desde el dominio nuevo, e iniciar sesión otra vez.
