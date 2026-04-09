import { formatRelativeTime, jsonContentToText } from '../../lib/utils'
import { TagBadge } from '../tag/TagBadge'
import styles from './NoteListRow.module.css'
import type { Note, Tag } from '../../types'

interface Props {
  note: Note
  tags: Tag[]
  isActive: boolean
  onClick: () => void
}

export function NoteListRow({ note, tags, isActive, onClick }: Props) {
  const preview = jsonContentToText(note.content).slice(0, 80)
  const noteTags = tags.filter((t) => note.tagIds.includes(t.id))

  return (
    <div
      className={styles.row}
      data-active={isActive ? 'true' : undefined}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className={styles.main}>
        <span className={styles.title}>{note.title || <em className={styles.untitled}>无标题</em>}</span>
        {preview && <span className={styles.preview}> — {preview}</span>}
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
