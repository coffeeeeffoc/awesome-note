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

  useEffect(() => {
    setMode('fullpage')

    // Restore last open note: hash > storage
    const hash = window.location.hash
    const match = hash.match(/^#note\/(.+)$/)
    if (match) {
      setActiveNote(match[1])
    } else {
      getStorage('lastOpenNoteId').then((id) => {
        if (id) setActiveNote(id)
      })
    }
  }, [setMode, setActiveNote])

  return <AppShell mode="fullpage" />
}

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
