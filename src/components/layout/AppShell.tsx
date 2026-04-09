import { TopBar } from './TopBar'
import { SpacePanel } from './SpacePanel'
import { NoteListPanel } from './NoteListPanel'
import { EditorPanel } from './EditorPanel'
import { useAppStore } from '../../store/appStore'
import styles from './AppShell.module.css'
import type { AppMode } from '../../types'

interface Props {
  mode: AppMode
}

export function AppShell({ mode }: Props) {
  const leftCollapsed = useAppStore((s) => s.leftCollapsed)
  const midCollapsed = useAppStore((s) => s.midCollapsed)
  const activeNoteId = useAppStore((s) => s.activeNoteId)

  return (
    <div
      className={styles.shell}
      data-mode={mode}
      data-left-collapsed={leftCollapsed ? 'true' : undefined}
      data-mid-collapsed={midCollapsed ? 'true' : undefined}
      data-note-open={activeNoteId ? 'true' : undefined}
    >
      <TopBar mode={mode} />
      <SpacePanel />
      <NoteListPanel />
      <EditorPanel />
    </div>
  )
}
