import { useRef, useCallback } from 'react'
import { TopBar } from './TopBar'
import { SpacePanel } from './SpacePanel'
import { EditorPanel } from './EditorPanel'
import { ToastContainer } from '../ui/Toast'
import { useTags } from '../../hooks/useTags'
import { useAppStore } from '../../store/appStore'
import styles from './AppShell.module.css'
import type { AppMode } from '../../types'

interface Props {
  mode: AppMode
}

export function AppShell({ mode }: Props) {
  const leftCollapsed = useAppStore((s) => s.leftCollapsed)
  const activeNoteId = useAppStore((s) => s.activeNoteId)
  const { tags } = useTags()
  const shellRef = useRef<HTMLDivElement>(null)

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const shell = shellRef.current
      if (!shell) return
      const startVal = parseInt(getComputedStyle(shell).getPropertyValue('--left-w')) || 280

      function onMove(ev: MouseEvent) {
        const delta = ev.clientX - startX
        const newVal = Math.max(200, Math.min(480, startVal + delta))
        shell!.style.setProperty('--left-w', `${newVal}px`)
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [],
  )

  const showDivider = mode !== 'popup' && !leftCollapsed

  return (
    <div
      ref={shellRef}
      className={styles.shell}
      data-mode={mode}
      data-left-collapsed={leftCollapsed ? 'true' : undefined}
      data-note-open={activeNoteId ? 'true' : undefined}
    >
      <TopBar mode={mode} />
      <SpacePanel tags={tags} />
      {showDivider && (
        <div
          className={styles.divider}
          style={{ gridArea: 'divider' }}
          onMouseDown={handleDrag}
        />
      )}
      <EditorPanel />
      <ToastContainer />
    </div>
  )
}
