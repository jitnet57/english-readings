import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Gutenberg 실제 텍스트를 Vite가 프록시 → 브라우저 CORS 우회 (개발용)
      '/gutenberg': {
        target: 'https://www.gutenberg.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/gutenberg/, ''),
      },
      // Gutendex 메타데이터 프록시
      '/gutendex': {
        target: 'https://gutendex.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/gutendex/, ''),
      },
    },
  },
})
