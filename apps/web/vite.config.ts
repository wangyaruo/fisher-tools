import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/** 共享包源码根目录：前端直接吃 TS 源码，不经过构建产物 */
const sharedSrc = fileURLToPath(new URL('../../packages/shared/src', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // 顺序有意义：@fisher-tools/* 必须排在 '@' 之前
    alias: [
      // @fisher-tools/shared 是源码直引的 workspace 包，且前端未声明该依赖
      // （因此 node_modules 里没有链接）。tsconfig 的 paths 只管类型检查，
      // Vite 需要自己的一套解析规则，否则运行时导入会报 Failed to resolve import。
      // 子路径与 packages/shared/package.json 的 exports 一一对应。
      {
        find: /^@fisher-tools\/shared$/,
        replacement: `${sharedSrc}/index.ts`,
      },
      {
        find: /^@fisher-tools\/shared\/(.+)$/,
        replacement: `${sharedSrc}/$1`,
      },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
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
