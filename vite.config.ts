import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/entries/popup/index.html',
        sidepanel: 'src/entries/sidepanel/index.html',
        fullpage: 'src/entries/fullpage/index.html',
      },
    },
  },
})
