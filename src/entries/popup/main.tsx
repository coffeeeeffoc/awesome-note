import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell } from '../../components/layout/AppShell'
import { useAppStore } from '../../store/appStore'
import { flushPendingDeleteImages } from '../../lib/storage'
import { deleteImageById } from '../../lib/db'
import '../../styles/global.css'

// Force exact popup dimensions via inline style (beats any stylesheet cascade)
Object.assign(document.documentElement.style, { width: '400px', height: '580px', overflow: 'hidden' })
Object.assign(document.body.style, { width: '400px', height: '580px', overflow: 'hidden' })

// Flush orphan images on startup
flushPendingDeleteImages().then(async (ids) => {
  for (const id of ids) {
    await deleteImageById(id)
  }
})

function App() {
  // Set mode
  useAppStore.getState().setMode('popup')
  return <AppShell mode="popup" />
}

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
