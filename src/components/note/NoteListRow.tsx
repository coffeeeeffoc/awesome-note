import { useState, useRef, useEffect } from 'react'
import { formatRelativeTime, jsonContentToText } from '../../lib/utils'
import { TagBadge } from '../tag/TagBadge'
import styles from './NoteListRow.module.css'
import type { Note, Tag } from '../../types'

interface Props {
  note: Note
  tags: Tag[]
  isActive: boolean
  onClick: () => void
  onTitleChange?: (noteId: string, title: string) => void
}

export function NoteListRow({ note, tags, isActive, onClick, onTitleChange }: Props) {
  const preview = jsonContentToText(note.content).slice(0, 80)
  const noteTags = tags.filter((t) => note.tagIds.includes(t.id))
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(note.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(note.title)
  }, [note.title])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function handleTitleClick(e: React.MouseEvent) {
    if (isActive && onTitleChange) {
      e.stopPropagation()
      setEditing(true)
    }
  }

  function commitEdit() {
    setEditing(false)
    const trimmed = editValue.trim()
    if (trimmed !== note.title && onTitleChange) {
      onTitleChange(note.id, trimmed)
    }
  }

  return (
    <div
      className={styles.row}
      data-active={isActive ? 'true' : undefined}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && !editing && onClick()}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-note-id', note.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <div className={styles.main}>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.titleInput}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') { setEditing(false); setEditValue(note.title) }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span className={styles.title} onClick={handleTitleClick}>
              {note.title || <em className={styles.untitled}>无标题</em>}
            </span>
            {preview && <span className={styles.preview}> — {preview}</span>}
          </>
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.tags}>
          {noteTags.slice(0, 2).map((t) => (
            <TagBadge key={t.id} tag={t} size="sm" />
          ))}
        </div>
        <time className={styles.time}>{formatRelativeTime(note.updatedAt)}</time>
      </div>
    </div>
  )
}
