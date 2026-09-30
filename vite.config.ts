import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Use the manifest we wrote ourselves in public/
      manifest: false,
      // Include the manifest file we wrote and the icons
      includeAssets: ['favicon.svg', 'icons/*.png'],
      workbox: {
        // ─── SECURITY: Never cache any API or auth responses ───────────────
        // These URL patterns will NOT be handled by the service worker at all.
        // Requests to these URLs always go directly to the network.
        navigateFallbackDenylist: [
          /^\/api\//,
        ],
        // Runtime caching: only safe, public, static resources
        runtimeCaching: [
          // Google Fonts CSS (safe, public)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          // Google Fonts files (safe, public, long-lived)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Images and SVGs (safe, static assets)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // ─── SECURITY: Explicitly block caching of all API calls ──────────
          // Any request to /api/** must go to the network only.
          // This covers: authentication, customers, bills, payments, reports.
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'api-no-cache',
            },
          },
          // ─── SECURITY: Block caching of Supabase endpoints ───────────────
          {
            urlPattern: /supabase\.co/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'supabase-no-cache',
            },
          },
        ],
        // The app shell (index.html) is served for all navigation requests
        // that are not in the denylist above
        navigateFallback: '/index.html',
        // Precache the built JS/CSS assets (fingerprinted, safe)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // ─── SECURITY: Exclude API and sensitive paths from precache ─────
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
