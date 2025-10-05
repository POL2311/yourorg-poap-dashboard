import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
    open: true
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
    }
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-wallets'
    ]
  }
})