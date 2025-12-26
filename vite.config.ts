import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { splitVendorChunkPlugin } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'firebase-vite-fix.preview.emergentagent.com',
      'localhost',
      '.preview.emergentagent.com'
    ]
  },
  plugins: [
    react(),
    // Split vendor chunks for better caching
    splitVendorChunkPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Toiral Task Board',
        short_name: 'Toiral Tasks',
        description: 'Task management application for Toiral',
        theme_color: '#f5f0e8',
        background_color: '#f5f0e8',
        display: 'standalone',
        orientation: 'portrait',
        scope: './',
        start_url: './',
        icons: [
          {
            src: 'pwa-icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-icons/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/i\.postimg\.cc\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'postimg-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/i\.pravatar\.cc\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pravatar-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: new RegExp('^https://toiral-taskboard-default-rtdb\\.asia-southeast1\\.firebasedatabase\\.app/.*'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-data',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  base: './', // Add base path for proper relative paths after deployment

  // Build optimization settings
  build: {
    // Generate sourcemaps for better debugging
    sourcemap: false,

    // Minify the output for smaller bundle size
    minify: 'terser',

    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log statements
        drop_debugger: true  // Remove debugger statements
      }
    },

    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Rollup options
    rollupOptions: {
      output: {
        // Chunk files by type for better caching
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('lucide')) {
              return 'vendor-ui';
            }
            return 'vendor'; // all other node_modules
          }
        }
      }
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase']
  }
})
