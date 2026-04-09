import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { useNotes } from '../../hooks/useNotes'
import { useTags } from '../../hooks/useTags'
import { Editor } from '../editor/Editor'
import { TagBadge } from '../tag/TagBadge'
import { Copy, Trash2, MoreHorizontal } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu'
import styles from './EditorPanel.module.css'
import type { Note } from '../../types'
import { getNoteById } from '../../lib/db'

export function EditorPanel() {
  const activeNoteId = useAppStore((s) => s.activeNoteId)
  const setActiveNote = useAppStore((s) => s.setActiveNote)
  const saveStatus = useAppStore((s) => s.saveStatus)
  const [note, setNote] = useState<Note | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const { saveNote, removeNote, copyNote } = useNotes()
  const { tags } = useTags()

  useEffect(() => {
    if (!activeNoteId) {
      setNote(null)
      return
    }
    getNoteById(activeNoteId).then((n) => setNote(n ?? null))
  }, [activeNoteId])

  if (!note) {
    return (
      <div className={styles.empty} style={{ gridArea: 'editor' }}>
        <p>选择或新建一篇笔记</p>
      </div>
    )
  }

  const noteTags = tags.filter((t) => note.tagIds.includes(t.id))

  const menuItems: ContextMenuItem[] = [
    {
      label: '创建副本',
      icon: <Copy size={13} />,
      onClick: async () => {
        const copy = await copyNote(note.id)
        setActiveNote(copy.id)
      },
    },
    {
      label: '删除笔记',
      icon: <Trash2 size={13} />,
      danger: true,
      onClick: async () => {
        await removeNote(note.id)
        setActiveNote(null)
      },
    },
  ]

  return (
    <div className={styles.panel} style={{ gridArea: 'editor' }}>
      {/* Meta bar */}
      <div className={styles.meta}>
        <input
          className={styles.title}
          placeholder="无标题"
          value={note.title}
          onChange={(e) => setNote({ ...note, title: e.target.value })}
        />
        <div className={styles.metaActions}>
          <div className={styles.tags}>
            {noteTags.map((t) => (
              <TagBadge
                key={t.id}
                tag={t}
                onRemove={() =>
                  setNote({ ...note, tagIds: note.tagIds.filter((id) => id !== t.id) })
                }
              />
            ))}
          </div>

          {/* Save indicator */}
          <div className={styles.saveStatus}>
            <span
              className={styles.dot}
              data-saving={saveStatus === 'saving' ? 'true' : undefined}
            />
          </div>

          {/* More menu */}
          <IconButton
            label="更多操作"
            size="sm"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              setMenuPos({ x: rect.left, y: rect.bottom + 4 })
            }}
          >
            <MoreHorizontal size={14} />
          </IconButton>
        </div>
      </div>

      {/* Editor */}
      <Editor
        note={note}
        onSave={async (updated) => {
          setNote(updated)
          await saveNote(updated)
        }}
      />

      {menuPos && (
        <ContextMenu items={menuItems} x={menuPos.x} y={menuPos.y} onClose={() => setMenuPos(null)} />
      )}
    </div>
  )
}
