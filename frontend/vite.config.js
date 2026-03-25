import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Triggering config reload to load postcss.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true
  }
})
