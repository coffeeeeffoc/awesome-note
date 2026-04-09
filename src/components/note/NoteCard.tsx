import { formatRelativeTime, jsonContentToText } from '../../lib/utils'
import { TagBadge } from '../tag/TagBadge'
import styles from './NoteCard.module.css'
import type { Note, Tag } from '../../types'

interface Props {
  note: Note
  tags: Tag[]
  isActive: boolean
  onClick: () => void
}

export function NoteCard({ note, tags, isActive, onClick }: Props) {
  const preview = jsonContentToText(note.content).slice(0, 80)
  const noteTags = tags.filter((t) => note.tagIds.includes(t.id))

  return (
    <div
      className={styles.card}
      data-active={isActive ? 'true' : undefined}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {note.title && <p className={styles.title}>{note.title}</p>}
      {preview && <p className={styles.preview}>{preview}</p>}
      <div className={styles.footer}>
        <div className={styles.tags}>
          {noteTags.slice(0, 3).map((t) => (
            <TagBadge key={t.id} tag={t} size="sm" />
          ))}
        </div>
        <time className={styles.time}>{formatRelativeTime(note.updatedAt)}</time>
      </div>
    </div>
  )
}
