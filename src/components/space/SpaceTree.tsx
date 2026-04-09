import { useState } from 'react'
import { Layers, Inbox } from 'lucide-react'
import { SpaceItem } from './SpaceItem'
import { SpaceModal } from './SpaceModal'
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
}

export function SpaceTree({
  spaces,
  notes,
  expandedIds,
  onToggle,
  onAdd,
  onRename,
  onDelete,
}: Props) {
  const activeSpaceId = useAppStore((s) => s.activeSpaceId)
  const setActiveSpace = useAppStore((s) => s.setActiveSpace)

  const [addModal, setAddModal] = useState<{ parentId: string | null } | null>(null)
  const [renameModal, setRenameModal] = useState<Space | null>(null)

  function countNotes(spaceId: string) {
    return notes.filter((n) => n.spaceId === spaceId).length
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
            />
            {hasChildren && isExpanded && renderTree(space.id, depth + 1)}
          </div>
        )
      })
  }

  const unclassifiedCount = notes.filter((n) => n.spaceId === null).length

  return (
    <div className={styles.tree} role="tree">
      {/* 全部笔记 */}
      <div
        className={styles.virtual}
        data-active={activeSpaceId === null ? 'true' : undefined}
        onClick={() => setActiveSpace(null)}
        role="treeitem"
        aria-selected={activeSpaceId === null}
      >
        <Layers size={14} className={styles.icon} />
        <span>全部笔记</span>
        <span className={styles.count}>{notes.length}</span>
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
