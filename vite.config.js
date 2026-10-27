import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Path the app is served from. GitHub Pages serves it under /Healthyapp/;
// on a custom domain build with BASE_PATH=/ (see README).
const BASE_PATH = process.env.BASE_PATH || '/Healthyapp/'

export default defineConfig({
  base: BASE_PATH,
  define: {
    // Injected at build time so the app can display which version is loaded
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'kora-touch-180.png'],
      manifest: {
        name: 'Kora · Entreno y peso',
        short_name: 'Kora',
        description: 'Entrenador personal de running y control de peso',
        theme_color: '#140B12',
        background_color: '#140B12',
        display: 'standalone',
        orientation: 'portrait',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          { src: 'kora-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'kora-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'kora-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
