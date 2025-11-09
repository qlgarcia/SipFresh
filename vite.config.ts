/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Only include the legacy plugin when explicitly requested via env var.
  // Leaving it enabled will produce duplicate legacy bundles which significantly
  // increase total build output. For most modern apps you can skip this.
  plugins: [
    react(),
    process.env.LEGACY_BUILD === 'true' ? legacy() : null,
  ].filter(Boolean),
  build: {
  // Increase the warning limit slightly and, more importantly, split vendors into
  // multiple chunks so the main entry bundle stays smaller.
  // Set to 800 KB to avoid noisy warnings for large-but-acceptable vendor chunks.
  chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // Split React
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }

            // Split Ionic packages into smaller chunks
            if (id.includes('@ionic/react-router') || id.includes('@ionic/react')) {
              return 'vendor-ionic-react'
            }
            // Separate ionicons into its own chunk
            if (id.includes('ionicons')) {
              return 'vendor-ionicons'
            }
            if (id.includes('@ionic')) {
              return 'vendor-ionic-core'
            }

            // Split Firebase by subpackages so auth/firestore/storage aren't bundled together
            if (id.includes('firebase/auth')) {
              return 'vendor-firebase-auth'
            }
            if (id.includes('firebase/firestore')) {
              return 'vendor-firebase-firestore'
            }
            if (id.includes('firebase/storage')) {
              return 'vendor-firebase-storage'
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase'
            }

            if (id.includes('bootstrap') || id.includes('react-bootstrap')) {
              return 'vendor-bootstrap'
            }

            return 'vendor'
          }
        }
      }
    }
  },
  // Default dev server settings (no forced HTTPS). Use your system tooling to enable
  // HTTPS if you need a trusted local certificate (e.g. mkcert). By leaving out the
  // `server.https` override we keep the original, simpler behavior.
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})

// Trigger new deployment
