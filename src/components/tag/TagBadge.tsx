import styles from './TagBadge.module.css'
import type { Tag } from '../../types'

interface Props {
  tag: Tag
  onRemove?: () => void
  size?: 'sm' | 'md'
}

export function TagBadge({ tag, onRemove, size = 'md' }: Props) {
  return (
    <span
      className={styles.badge}
      data-size={size}
      style={{ '--tag-color': tag.color } as React.CSSProperties}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          onClick={onRemove}
          aria-label={`移除标签 ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  )
}
