import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell } from '../../components/layout/AppShell'
import { useAppStore } from '../../store/appStore'
import { flushPendingDeleteImages, getStorage } from '../../lib/storage'
import { deleteImageById } from '../../lib/db'
import '../../styles/global.css'

flushPendingDeleteImages().then(async (ids) => {
  for (const id of ids) {
    await deleteImageById(id)
  }
})

function App() {
  const setMode = useAppStore((s) => s.setMode)
  const setActiveNote = useAppStore((s) => s.setActiveNote)
  const setActiveSpace = useAppStore((s) => s.setActiveSpace)

  useEffect(() => {
    setMode('sidepanel')
    // Restore state from storage (persisted by source panel before switching)
    getStorage('lastOpenNoteId').then((id) => {
      if (id) setActiveNote(id)
    })
    getStorage('lastOpenSpaceId').then((id) => {
      if (id) setActiveSpace(id)
    })
  }, [setMode, setActiveNote, setActiveSpace])

  return <AppShell mode="sidepanel" />
}

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
