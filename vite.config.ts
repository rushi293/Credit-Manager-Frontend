import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
            manifest: false,
            includeAssets: ['favicon.svg', 'icons/*.png'],
      workbox: {
                                navigateFallbackDenylist: [
          /^\/api\//,
        ],
                runtimeCaching: [
                    {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
                    {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30,               },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
                    {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,               },
            },
          },
                                        {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'api-no-cache',
            },
          },
                    {
            urlPattern: /supabase\.co/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'supabase-no-cache',
            },
          },
        ],
                        navigateFallback: '/index.html',
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                globIgnores: [
          '**/node_modules/**',
          '**/api/**',
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
