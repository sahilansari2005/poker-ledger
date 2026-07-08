import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendPort = process.env.BACKEND_PORT || '8000'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Poker Ledger',
        short_name: 'Poker Ledger',
        description: 'Track poker buy-ins, cash-outs, chips, and session stats.',
        theme_color: '#4f5bd5',
        background_color: '#dde3ef',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['finance', 'utilities'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/_allauth/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../backend/static/frontend',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      },
      '/_allauth': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
})
