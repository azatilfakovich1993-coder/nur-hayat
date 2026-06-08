import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages раздаёт сайт из подпути /nur-hayat/, а Firebase Hosting — с корня /.
// BASE_PATH/OUT_DIR переопределяются только при сборке для Firebase (см. деплой),
// обычная сборка (npm run build, GitHub Actions) использует значения по умолчанию.
const BASE = process.env.BASE_PATH || '/nur-hayat/'
const OUT_DIR = process.env.OUT_DIR || 'dist'

export default defineConfig({
  base: BASE,
  build: { outDir: OUT_DIR },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Nur Hayat · نور حياة',
        short_name: 'Nur Hayat',
        description: 'Светлая жизнь — духовное приложение для мусульман',
        theme_color: '#070710',
        background_color: '#070710',
        display: 'standalone',
        orientation: 'portrait',
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        globIgnores: ['**/audio/**', '**/prayer/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB — для бандла с Кораном
      }
    })
  ]
})
