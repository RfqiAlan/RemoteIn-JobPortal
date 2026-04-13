import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // ← Wajib agar bisa diakses dari luar container
    port: 5173,
    proxy: {
      '/api': {
        // Pakai env var: saat Docker → http://backend:8000, lokal → http://127.0.0.1:8000
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})