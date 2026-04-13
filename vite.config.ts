import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('wagmi') || id.includes('viem')) return 'web3'
          if (id.includes('react') || id.includes('react-dom')) return 'react'
          return undefined
        },
      },
    },
  },
})
