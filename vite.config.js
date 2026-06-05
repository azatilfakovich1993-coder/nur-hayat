import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({

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
        scope: '/',
        start_url: '/',
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
