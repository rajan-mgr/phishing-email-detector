import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/auth': 'http://localhost:5000',
      '/scan': 'http://localhost:5000',
      '/history': 'http://localhost:5000',
      '/model': 'http://localhost:5000',
    },
  },
})