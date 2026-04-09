import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        popup: 'src/entries/popup/index.html',
        sidepanel: 'src/entries/sidepanel/index.html',
        fullpage: 'src/entries/fullpage/index.html',
      },
      output: {
        manualChunks: {
          // Split Tiptap editor (large dependency)
          'tiptap': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-link'],
          // Split React into its own chunk
          'react-vendor': ['react', 'react-dom'],
          // Split other vendors
          'vendor': ['zustand', 'idb', 'lucide-react'],
        },
      },
    },
  },
})
