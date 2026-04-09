import { useAppStore } from '../../store/appStore'
import { useNotes } from '../../hooks/useNotes'
import { useTags } from '../../hooks/useTags'
import { NoteListRow } from '../note/NoteListRow'
import { NoteCard } from '../note/NoteCard'
import { getNoteById, updateNote } from '../../lib/db'
import { getSyncBus } from '../../lib/sync'
import styles from './NoteListPanel.module.css'

export function NoteListPanel() {
  const { activeSpaceId, activeNoteId, setActiveNote, viewMode, searchQuery } = useAppStore()
  const { notes, addNote, reload } = useNotes(
    searchQuery ? undefined : activeSpaceId,
    searchQuery,
  )
  const { tags } = useTags()

  async function handleNewNote() {
    const note = await addNote(activeSpaceId === 'unclassified' ? null : activeSpaceId)
    setActiveNote(note.id)
  }

  async function handleTitleChange(noteId: string, title: string) {
    const note = await getNoteById(noteId)
    if (!note) return
    const updated = { ...note, title }
    await updateNote(updated)
    getSyncBus().broadcast({ type: 'NOTE_UPDATED', id: noteId })
    await reload()
  }

  return (
    <div className={styles.panel} style={{ gridArea: 'mid' }}>
      <div className={styles.header}>
        <span className={styles.count}>{notes.length} 条笔记</span>
        <button type="button" className={styles.newBtn} onClick={handleNewNote}>
          + 新建
        </button>
      </div>

      <div
        className={styles.list}
        data-view={viewMode}
      >
        {notes.length === 0 && (
          <div className={styles.empty}>
            <p>暂无笔记</p>
            <button type="button" onClick={handleNewNote}>
              点击新建
            </button>
          </div>
        )}

        {viewMode === 'list'
          ? notes.map((note) => (
              <NoteListRow
                key={note.id}
                note={note}
                tags={tags}
                isActive={activeNoteId === note.id}
                onClick={() => setActiveNote(note.id)}
                onTitleChange={handleTitleChange}
              />
            ))
          : notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                tags={tags}
                isActive={activeNoteId === note.id}
                onClick={() => setActiveNote(note.id)}
              />
            ))}
      </div>
    </div>
  )
}
