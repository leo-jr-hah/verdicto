import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3011',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3011',
        ws: true,
      },
    },
  },
  // @ts-expect-error -- vitest augments UserConfigExport but tsc -b in project-references mode doesn't see it
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
