/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  // Default dev server settings (no forced HTTPS). Use your system tooling to enable
  // HTTPS if you need a trusted local certificate (e.g. mkcert). By leaving out the
  // `server.https` override we keep the original, simpler behavior.
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
