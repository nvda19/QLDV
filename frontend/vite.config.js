import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // ExcelJS browser build vẫn tham chiếu 'global' từ Node.js
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['exceljs'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },

  },
})
