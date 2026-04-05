import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://my-orchtrai-backend-123.azurewebsites.net/',
        changeOrigin: true,
      },
      '/auth': {
        target: 'https://my-orchtrai-backend-123.azurewebsites.net/',
        changeOrigin: true,
      },
    },
  },
})
