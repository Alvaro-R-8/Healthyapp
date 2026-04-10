/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: { 900: '#0f0f1a', 800: '#1a1a2e', 700: '#16213e', 600: '#1f2b47' },
        brand: { green: '#22c55e', blue: '#3b82f6', orange: '#f97316', red: '#ef4444', purple: '#a855f7', gold: '#eab308' }
      }
    }
  },
  plugins: []
}
