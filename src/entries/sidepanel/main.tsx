import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell } from '../../components/layout/AppShell'
import { useAppStore } from '../../store/appStore'
import { flushPendingDeleteImages } from '../../lib/storage'
import { deleteImageById } from '../../lib/db'
import '../../styles/global.css'

flushPendingDeleteImages().then(async (ids) => {
  for (const id of ids) {
    await deleteImageById(id)
  }
})

function App() {
  useAppStore.getState().setMode('sidepanel')
  return <AppShell mode="sidepanel" />
}

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
