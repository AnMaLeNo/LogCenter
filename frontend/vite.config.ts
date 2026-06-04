import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    // Dev parity with production: the app calls its API at the relative path
    // "/api" (see src/api.ts). In production nginx proxies /api -> backend.
    // In development the Vite dev server does the same, so the exact same
    // relative API calls work in both modes with no code changes.
    // BACKEND_ORIGIN lets the dev compose point at the backend service;
    // defaults to localhost for running the dev server outside Docker.
    proxy: {
      '/api': {
        target: process.env.BACKEND_ORIGIN ?? 'http://localhost:8420',
        changeOrigin: true,
        // Strip the /api prefix so /api/logs/search -> backend /logs/search,
        // matching the nginx rewrite used in production.
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
