import { useState } from 'react'
import { Layers, Inbox, Plus } from 'lucide-react'
import { SpaceItem } from './SpaceItem'
import { SpaceModal } from './SpaceModal'
import { IconButton } from '../ui/IconButton'
import { useAppStore } from '../../store/appStore'
import styles from './SpaceTree.module.css'
import type { Space, Note } from '../../types'

interface Props {
  spaces: Space[]
  notes: Note[]
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onAdd: (name: string, parentId: string | null) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onMoveSpace?: (spaceId: string, newParentId: string | null) => void
  onMoveNote?: (noteId: string, spaceId: string | null) => void
  onNewNote?: (spaceId: string | null) => void
}

export function SpaceTree({
  spaces,
  notes,
  expandedIds,
  onToggle,
  onAdd,
  onRename,
  onDelete,
  onMoveSpace,
  onMoveNote,
  onNewNote,
}: Props) {
  const activeSpaceId = useAppStore((s) => s.activeSpaceId)
  const setActiveSpace = useAppStore((s) => s.setActiveSpace)

  const [addModal, setAddModal] = useState<{ parentId: string | null } | null>(null)
  const [renameModal, setRenameModal] = useState<Space | null>(null)
  const [rootDragOver, setRootDragOver] = useState(false)

  function countNotes(spaceId: string) {
    return notes.filter((n) => n.spaceId === spaceId).length
  }

  function handleRootDrop(e: React.DragEvent) {
    e.preventDefault()
    setRootDragOver(false)
    const droppedSpaceId = e.dataTransfer.getData('application/x-space-id')
    const droppedNoteId = e.dataTransfer.getData('application/x-note-id')
    if (droppedSpaceId && onMoveSpace) {
      onMoveSpace(droppedSpaceId, null)
    }
    if (droppedNoteId && onMoveNote) {
      onMoveNote(droppedNoteId, null)
    }
  }

  function renderTree(parentId: string | null, depth = 0) {
    return spaces
      .filter((s) => s.parentId === parentId)
      .map((space) => {
        const hasChildren = spaces.some((s) => s.parentId === space.id)
        const isExpanded = expandedIds.has(space.id)

        return (
          <div key={space.id}>
            <SpaceItem
              space={space}
              depth={depth}
              noteCount={countNotes(space.id)}
              isExpanded={isExpanded}
              isActive={activeSpaceId === space.id}
              onSelect={() => setActiveSpace(space.id)}
              onToggle={() => onToggle(space.id)}
              onAdd={() => setAddModal({ parentId: space.id })}
              onRename={() => setRenameModal(space)}
              onDelete={() => onDelete(space.id)}
              onDropSpace={(sid, tid) => onMoveSpace?.(sid, tid)}
              onDropNote={(nid, tid) => onMoveNote?.(nid, tid)}
            />
            {hasChildren && isExpanded && renderTree(space.id, depth + 1)}
          </div>
        )
      })
  }

  const unclassifiedCount = notes.filter((n) => n.spaceId === null).length

  return (
    <div className={styles.tree} role="tree">
      {/* 全部笔记 — also a root drop zone */}
      <div
        className={styles.virtual}
        data-active={activeSpaceId === null ? 'true' : undefined}
        data-dragover={rootDragOver ? 'true' : undefined}
        onClick={() => setActiveSpace(null)}
        role="treeitem"
        aria-selected={activeSpaceId === null}
        onDragOver={(e) => { e.preventDefault(); setRootDragOver(true) }}
        onDragLeave={() => setRootDragOver(false)}
        onDrop={handleRootDrop}
      >
        <Layers size={14} className={styles.icon} />
        <span>全部笔记</span>
        <span className={styles.count}>{notes.length}</span>
        {onNewNote && (
          <IconButton
            label="在根目录新建笔记"
            size="sm"
            className={styles.newBtn}
            onClick={(e) => { e.stopPropagation(); onNewNote(null) }}
          >
            <Plus size={12} />
          </IconButton>
        )}
      </div>

      {/* Space tree */}
      {renderTree(null)}

      {/* 未归类 */}
      {unclassifiedCount > 0 && (
        <div
          className={styles.virtual}
          data-active={activeSpaceId === 'unclassified' ? 'true' : undefined}
          onClick={() => setActiveSpace('unclassified')}
          role="treeitem"
        >
          <Inbox size={14} className={styles.icon} />
          <span>未归类</span>
          <span className={styles.count}>{unclassifiedCount}</span>
        </div>
      )}

      {/* Add/Rename modals */}
      {addModal !== null && (
        <SpaceModal
          mode="add"
          siblings={spaces.filter((s) => s.parentId === addModal.parentId)}
          onConfirm={(name) => {
            onAdd(name, addModal.parentId)
            setAddModal(null)
          }}
          onClose={() => setAddModal(null)}
        />
      )}
      {renameModal && (
        <SpaceModal
          mode="rename"
          defaultName={renameModal.name}
          siblings={spaces.filter(
            (s) => s.parentId === renameModal.parentId && s.id !== renameModal.id,
          )}
          onConfirm={(name) => {
            onRename(renameModal.id, name)
            setRenameModal(null)
          }}
          onClose={() => setRenameModal(null)}
        />
      )}
    </div>
  )
}
