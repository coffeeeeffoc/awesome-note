import { useEffect, useRef } from 'react'
import styles from './ContextMenu.module.css'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  danger?: boolean
  onClick: () => void
}

interface Props {
  items: ContextMenuItem[]
  x: number
  y: number
  onClose: () => void
}

export function ContextMenu({ items, x, y, onClose }: Props) {
  const ref = useRef<HTMLUListElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <ul
      ref={ref}
      role="menu"
      className={styles.menu}
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <li key={i} role="presentation">
          <button
            role="menuitem"
            type="button"
            data-danger={item.danger ? 'true' : undefined}
            className={styles.item}
            onClick={() => {
              item.onClick()
              onClose()
            }}
          >
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  )
}
