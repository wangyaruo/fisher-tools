import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // 开发期把 /api 转发到后端，避免跨域与硬编码端口
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
