import { useState, useRef } from 'react'
import { ChevronRight, FolderPlus, Edit2, Trash2, MoreHorizontal } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu'
import styles from './SpaceItem.module.css'
import type { Space } from '../../types'

interface Props {
  space: Space
  depth: number
  noteCount: number
  isExpanded: boolean
  isActive: boolean
  onSelect: () => void
  onToggle: () => void
  onAdd: () => void
  onRename: () => void
  onDelete: () => void
  onDropSpace?: (spaceId: string, targetParentId: string) => void
  onDropNote?: (noteId: string, targetSpaceId: string) => void
}

export function SpaceItem({
  space,
  depth,
  noteCount,
  isExpanded,
  isActive,
  onSelect,
  onToggle,
  onAdd,
  onRename,
  onDelete,
  onDropSpace,
  onDropNote,
}: Props) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const menuItems: ContextMenuItem[] = [
    { label: '重命名', icon: <Edit2 size={13} />, onClick: onRename },
    { label: '新建子空间', icon: <FolderPlus size={13} />, onClick: onAdd },
    { label: '删除空间', icon: <Trash2 size={13} />, danger: true, onClick: onDelete },
  ]

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
  }

  function openMenu(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPos({ x: rect.left, y: rect.bottom + 4 })
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/x-space-id', space.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const droppedSpaceId = e.dataTransfer.getData('application/x-space-id')
    const droppedNoteId = e.dataTransfer.getData('application/x-note-id')
    if (droppedSpaceId && droppedSpaceId !== space.id && onDropSpace) {
      onDropSpace(droppedSpaceId, space.id)
    }
    if (droppedNoteId && onDropNote) {
      onDropNote(droppedNoteId, space.id)
    }
  }

  return (
    <div
      className={styles.wrapper}
      style={{ paddingLeft: depth * 12 + 4 }}
      onContextMenu={handleContextMenu}
    >
      <div
        className={styles.row}
        data-active={isActive ? 'true' : undefined}
        data-dragover={dragOver ? 'true' : undefined}
        onClick={onSelect}
        role="treeitem"
        aria-selected={isActive}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          type="button"
          className={styles.toggle}
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          aria-label={isExpanded ? '收起' : '展开'}
        >
          <ChevronRight size={12} className={isExpanded ? styles.expanded : ''} />
        </button>

        <span className={styles.name}>{space.name}</span>

        {noteCount > 0 && <span className={styles.count}>{noteCount}</span>}

        <IconButton
          ref={btnRef}
          label="更多操作"
          size="sm"
          className={styles.more}
          onClick={(e) => {
            e.stopPropagation()
            openMenu(e)
          }}
        >
          <MoreHorizontal size={13} />
        </IconButton>
      </div>

      {menuPos && (
        <ContextMenu
          items={menuItems}
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setMenuPos(null)}
        />
      )}
    </div>
  )
}
