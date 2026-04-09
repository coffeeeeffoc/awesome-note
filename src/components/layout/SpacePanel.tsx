import { useState, useEffect } from 'react'
import { FolderPlus, ChevronDown, ChevronRight, Plus, Layers, Inbox, FileText } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { SpaceModal } from '../space/SpaceModal'
import { useSpaces } from '../../hooks/useSpaces'
import { useNotes } from '../../hooks/useNotes'
import { useAppStore } from '../../store/appStore'
import { getSyncBus } from '../../lib/sync'
import { formatRelativeTime } from '../../lib/utils'
import styles from './SpacePanel.module.css'
import type { Space, Note, Tag } from '../../types'

interface Props {
  tags: Tag[]
}

export function SpacePanel({ tags: _tags }: Props) {
  const {
    spaces,
    expandedIds,
    addSpace,
    renameSpace,
    toggleExpanded,
    expandAll,
    collapseAll,
  } = useSpaces()
  const { notes, addNote, saveNote } = useNotes()
  const { activeSpaceId, activeNoteId, setActiveNote, setActiveSpace } = useAppStore()
  const [showAddRoot, setShowAddRoot] = useState(false)
  const [renameSpaceId, setRenameSpaceId] = useState<string | null>(null)
  const [editNoteId, setEditNoteId] = useState<string | null>(null)

  // Get notes for a specific space
  function getNotesForSpace(spaceId: string | null) {
    if (spaceId === null) return notes.filter((n) => n.spaceId === null)
    return notes.filter((n) => n.spaceId === spaceId)
  }

  async function handleNewNote(spaceId: string | null) {
    const note = await addNote(spaceId)
    setActiveNote(note.id)
  }

  async function handleNoteTitleChange(noteId: string, title: string) {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return
    const updated = { ...note, title }
    getSyncBus().broadcast({ type: 'NOTE_TITLE_CHANGED', id: noteId, title })
    await saveNote(updated)
  }

  const allExpanded = expandedIds.size === spaces.length && spaces.length > 0

  return (
    <div className={styles.panel} style={{ gridArea: 'left' }}>
      <div className={styles.header}>
        <span className={styles.label}>空间与笔记</span>
        <div className={styles.headerActions}>
          <IconButton
            label={allExpanded ? '全部收起' : '全部展开'}
            size="sm"
            onClick={allExpanded ? collapseAll : expandAll}
          >
            {allExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </IconButton>
          <IconButton label="新建空间" size="sm" onClick={() => setShowAddRoot(true)}>
            <FolderPlus size={13} />
          </IconButton>
        </div>
      </div>

      <div className={styles.list}>
        {/* 全部笔记 */}
        <SpaceSection
          label="全部笔记"
          icon={<Layers size={14} />}
          count={notes.length}
          isActive={activeSpaceId === null}
          onClick={() => setActiveSpace(null)}
          onNewNote={() => handleNewNote(null)}
        />

        {/* Space tree with nested notes */}
        {renderSpaceTree(null, 0)}

        {/* 未归类 */}
        {getNotesForSpace(null).length > 0 && (
          <SpaceSection
            label="未归类"
            icon={<Inbox size={14} />}
            count={getNotesForSpace(null).length}
            isActive={activeSpaceId === 'unclassified'}
            onClick={() => setActiveSpace('unclassified')}
          />
        )}
      </div>

      {showAddRoot && (
        <SpaceModal
          mode="add"
          siblings={spaces.filter((s) => s.parentId === null)}
          onConfirm={(name) => {
            addSpace(name, null)
            setShowAddRoot(false)
          }}
          onClose={() => setShowAddRoot(false)}
        />
      )}

      {renameSpaceId && (
        <SpaceModal
          mode="rename"
          defaultName={spaces.find((s) => s.id === renameSpaceId)?.name || ''}
          siblings={spaces.filter(
            (s) => s.parentId === spaces.find((sp) => sp.id === renameSpaceId)?.parentId && s.id !== renameSpaceId,
          )}
          onConfirm={(name) => {
            renameSpace(renameSpaceId, name)
            setRenameSpaceId(null)
          }}
          onClose={() => setRenameSpaceId(null)}
        />
      )}
    </div>
  )

  function renderSpaceTree(parentId: string | null, depth: number) {
    return spaces
      .filter((s) => s.parentId === parentId)
      .map((space) => {
        const hasChildren = spaces.some((s) => s.parentId === space.id)
        const isExpanded = expandedIds.has(space.id)
        const spaceNotes = getNotesForSpace(space.id)
        const isActive = activeSpaceId === space.id

        return (
          <div key={space.id}>
            <SpaceItemRow
              space={space}
              depth={depth}
              noteCount={spaceNotes.length}
              isExpanded={isExpanded}
              hasChildren={hasChildren}
              isActive={isActive}
              onToggle={() => toggleExpanded(space.id)}
              onSelect={() => setActiveSpace(space.id)}
              onRename={() => setRenameSpaceId(space.id)}
              onNewNote={() => handleNewNote(space.id)}
            />

            {/* Nested notes when expanded */}
            {isExpanded && spaceNotes.length > 0 && (
              <div className={styles.noteList}>
                {spaceNotes.map((note) => (
                  <NoteItemRow
                    key={note.id}
                    note={note}
                    depth={depth + 1}
                    isActive={activeNoteId === note.id}
                    isEditing={editNoteId === note.id}
                    onClick={() => setActiveNote(note.id)}
                    onDoubleClick={() => setEditNoteId(note.id)}
                    onTitleChange={(title) => handleNoteTitleChange(note.id, title)}
                    onEditEnd={() => setEditNoteId(null)}
                  />
                ))}
              </div>
            )}

            {/* Child spaces */}
            {hasChildren && isExpanded && renderSpaceTree(space.id, depth + 1)}
          </div>
        )
      })
  }
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function SpaceSection({
  label,
  icon,
  count,
  isActive,
  onClick,
  onNewNote,
}: {
  label: string
  icon: React.ReactNode
  count: number
  isActive: boolean
  onClick: () => void
  onNewNote?: () => void
}) {
  return (
    <div className={styles.section} data-active={isActive} onClick={onClick}>
      <span className={styles.sectionIcon}>{icon}</span>
      <span className={styles.sectionLabel}>{label}</span>
      <span className={styles.sectionCount}>{count}</span>
      {onNewNote && (
        <IconButton label="新建笔记" size="sm" className={styles.sectionNewBtn} onClick={(e) => { e.stopPropagation(); onNewNote() }}>
          <Plus size={12} />
        </IconButton>
      )}
    </div>
  )
}

function SpaceItemRow({
  space,
  depth,
  noteCount,
  isExpanded,
  hasChildren,
  isActive,
  onToggle,
  onSelect,
  onRename,
  onNewNote,
}: {
  space: Space
  depth: number
  noteCount: number
  isExpanded: boolean
  hasChildren: boolean
  isActive: boolean
  onToggle: () => void
  onSelect: () => void
  onRename: () => void
  onNewNote: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(space.name)

  function handleNameClick(e: React.MouseEvent) {
    e.stopPropagation()
    setEditing(true)
  }

  function handleDoubleClick() {
    setEditing(true)
  }

  function commitEdit() {
    setEditing(false)
    if (editValue.trim() && editValue.trim() !== space.name) {
      onRename()
    }
  }

  return (
    <div
      className={styles.spaceItem}
      style={{ paddingLeft: depth * 12 + 4 }}
      data-active={isActive}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      <button
        type="button"
        className={styles.chevron}
        onClick={(e) => { e.stopPropagation(); onToggle() }}
      >
        {hasChildren ? (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span style={{ width: 12 }} />}
      </button>

      <span className={styles.folderIcon}>
        {isExpanded ? <FolderPlus size={13} /> : <FolderPlus size={13} style={{ opacity: 0.7 }} />}
      </span>

      {editing ? (
        <input
          ref={(el) => { if (el) el.focus() }}
          className={styles.spaceNameInput}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className={styles.spaceName} onClick={handleNameClick}>
          {space.name}
        </span>
      )}

      {noteCount > 0 && <span className={styles.noteCount}>{noteCount}</span>}

      <div className={styles.spaceActions}>
        <IconButton label="新建笔记" size="sm" onClick={(e) => { e.stopPropagation(); onNewNote() }}>
          <Plus size={12} />
        </IconButton>
      </div>
    </div>
  )
}

function NoteItemRow({
  note,
  depth,
  isActive,
  isEditing,
  onClick,
  onDoubleClick,
  onTitleChange,
  onEditEnd,
}: {
  note: Note
  depth: number
  isActive: boolean
  isEditing: boolean
  onClick: () => void
  onDoubleClick: () => void
  onTitleChange: (title: string) => void
  onEditEnd: () => void
}) {
  const [editValue, setEditValue] = useState(note.title)

  // Sync editValue when note.title changes from external updates
  useEffect(() => {
    if (!isEditing) {
      setEditValue(note.title)
    }
  }, [note.title, isEditing])

  function commitEdit() {
    onEditEnd()
    if (editValue.trim() !== note.title) {
      onTitleChange(editValue.trim())
    }
  }

  return (
    <div
      className={styles.noteItem}
      style={{ paddingLeft: depth * 12 }}
      data-active={isActive}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-note-id', note.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <span className={styles.noteIcon}>
        <FileText size={12} />
      </span>

      {isEditing ? (
        <input
          className={styles.noteTitleInput}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') onEditEnd() }}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <>
          <span className={styles.noteTitle}>{note.title || '无标题'}</span>
          <span className={styles.noteTime}>{formatRelativeTime(note.updatedAt)}</span>
        </>
      )}
    </div>
  )
}
