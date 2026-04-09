import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { History, Camera, RotateCcw, Trash2, X } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { useToastStore } from '../ui/Toast'
import {
  createSnapshot,
  getSnapshotsForNote,
  deleteSnapshotsAfter,
  updateNote,
  getNoteById,
} from '../../lib/db'
import { getSyncBus } from '../../lib/sync'
import { formatTime, simpleDiff, jsonContentToText } from '../../lib/utils'
import styles from './SnapshotPanel.module.css'
import type { Note, Snapshot } from '../../types'

interface Props {
  note: Note
  onRestore: (note: Note) => void
}

interface AnimState {
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  targetX: number
  targetY: number
}

export function SnapshotPanel({ note, onRestore }: Props) {
  const [open, setOpen] = useState(false)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [animState, setAnimState] = useState<AnimState | null>(null)
  const [animPhase, setAnimPhase] = useState<'idle' | 'shrink' | 'jump'>('idle')
  const addToast = useToastStore((s) => s.addToast)

  const reload = useCallback(async () => {
    const list = await getSnapshotsForNote(note.id)
    setSnapshots(list)
  }, [note.id])

  useEffect(() => {
    if (open) reload()
  }, [open, reload])

  async function handleAddSnapshot(e: React.MouseEvent) {
    const btn = e.currentTarget as HTMLElement
    const btnRect = btn.getBoundingClientRect()

    // Find the title input element (editor panel title)
    const titleInput = document.querySelector('[data-note-title]') as HTMLInputElement
    const editorPanel = titleInput?.closest('[style*="grid-area: editor"]') as HTMLElement

    if (editorPanel && titleInput) {
      const editorRect = editorPanel.getBoundingClientRect()
      const titleRect = titleInput.getBoundingClientRect()

      // Start from title area
      const startX = titleRect.left + titleRect.width / 2
      const startY = titleRect.top + titleRect.height / 2
      const startWidth = Math.min(editorRect.width - 40, 300)
      const startHeight = Math.min(editorRect.height - 100, 200)

      // Target is the camera button
      const targetX = btnRect.left + btnRect.width / 2
      const targetY = btnRect.top + btnRect.height / 2

      setAnimState({ startX, startY, startWidth, startHeight, targetX, targetY })
      setAnimPhase('shrink')

      // Phase 1: Shrink animation (500ms)
      await new Promise((r) => setTimeout(r, 500))

      // Phase 2: Jump into icon (300ms)
      setAnimPhase('jump')
      await new Promise((r) => setTimeout(r, 300))
    } else {
      // Fallback: simpler animation
      await new Promise((r) => setTimeout(r, 300))
    }

    setAnimPhase('idle')
    setAnimState(null)

    await createSnapshot({
      noteId: note.id,
      title: note.title,
      content: note.content,
      trigger: 'manual',
    })

    addToast('快照已添加')
    await reload()
  }

  async function handleRestore(snapshot: Snapshot, deleteAfter: boolean) {
    const current = await getNoteById(note.id)
    if (!current) return

    if (deleteAfter) {
      await deleteSnapshotsAfter(note.id, snapshot.createdAt)
    } else {
      await createSnapshot({
        noteId: note.id,
        title: current.title,
        content: current.content,
        trigger: 'manual',
      })
    }

    const restored = { ...current, title: snapshot.title, content: snapshot.content }
    await updateNote(restored)
    getSyncBus().broadcast({ type: 'NOTE_UPDATED', id: note.id })
    onRestore(restored)
    addToast('已回退到该快照')
    await reload()
  }

  function getDiffText(index: number): string | null {
    if (index >= snapshots.length - 1) return null
    const current = snapshots[index]
    const prev = snapshots[index + 1]
    const currentText = jsonContentToText(current.content)
    const prevText = jsonContentToText(prev.content)
    if (currentText === prevText && current.title === prev.title) return '无变更'

    const diffs = simpleDiff(prevText, currentText)
    const lines: string[] = []
    if (current.title !== prev.title) {
      lines.push(`标题: "${prev.title}" → "${current.title}"`)
    }
    for (const d of diffs) {
      if (d.type === 'add') lines.push(`+ ${d.text}`)
      else if (d.type === 'remove') lines.push(`- ${d.text}`)
    }
    return lines.slice(0, 10).join('\n') || '无变更'
  }

  return (
    <>
      <div className={styles.toolbar}>
        <IconButton
          label="保存快照 (或按⌘S)"
          size="sm"
          onClick={handleAddSnapshot}
          active={animPhase !== 'idle'}
        >
          <Camera size={15} />
        </IconButton>
        <IconButton
          label="快照历史"
          size="sm"
          active={open}
          onClick={() => setOpen((v) => !v)}
        >
          <History size={15} />
        </IconButton>
      </div>

      {/* Snapshot animation overlay */}
      {animState && animPhase !== 'idle' && createPortal(
        <div className={styles.snapshotAnim}>
          <div
            className={styles.snapshotCard}
            data-phase={animPhase}
            style={{
              '--start-x': `${animState.startX}px`,
              '--start-y': `${animState.startY}px`,
              '--start-width': `${animState.startWidth}px`,
              '--start-height': `${animState.startHeight}px`,
              '--target-x': `${animState.targetX}px`,
              '--target-y': `${animState.targetY}px`,
            } as React.CSSProperties}
          >
            <div className={styles.cardPreview}>
              <div className={styles.cardTitle}>{note.title || '无标题'}</div>
              <div className={styles.cardHint}>正在保存快照...</div>
            </div>
          </div>
          {/* Glow effect on button */}
          <div
            className={styles.buttonGlow}
            style={{
              left: animState.targetX - 20,
              top: animState.targetY - 20,
            }}
          />
        </div>,
        document.body
      )}

      {open && (
        <div className={styles.drawerOverlay} onClick={() => setOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span>快照历史</span>
              <IconButton label="关闭" size="sm" onClick={() => setOpen(false)}>
                <X size={14} />
              </IconButton>
            </div>

            {snapshots.length === 0 && (
              <div className={styles.empty}>
                <p>暂无快照</p>
                <p className={styles.hint}>点击相机图标或按⌘S添加快照</p>
              </div>
            )}

            <div className={styles.list}>
              {snapshots.map((s, i) => (
                <SnapshotItem
                  key={s.id}
                  snapshot={s}
                  diffText={getDiffText(i)}
                  onRestore={handleRestore}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SnapshotItem({
  snapshot,
  diffText,
  onRestore,
}: {
  snapshot: Snapshot
  diffText: string | null
  onRestore: (s: Snapshot, deleteAfter: boolean) => void
}) {
  const [showActions, setShowActions] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)
  const [diffPos, setDiffPos] = useState({ x: 0, y: 0 })

  const triggerLabel = snapshot.trigger === 'manual' ? '手动' : '⌘S'

  function handleDiffHover() {
    if (!itemRef.current || !diffText) return
    const rect = itemRef.current.getBoundingClientRect()
    setDiffPos({ x: rect.left - 8, y: rect.bottom + 4 })
    setShowDiff(true)
  }

  return (
    <div
      ref={itemRef}
      className={styles.item}
      onMouseEnter={handleDiffHover}
      onMouseLeave={() => setShowDiff(false)}
    >
      <div className={styles.itemMain}>
        <time className={styles.time}>{formatTime(snapshot.createdAt)}</time>
        <span className={styles.trigger}>{triggerLabel}</span>
        <div className={styles.itemActions}>
          <IconButton
            label="回退到此版本"
            size="sm"
            onClick={() => setShowActions((v) => !v)}
          >
            <RotateCcw size={13} />
          </IconButton>
        </div>
      </div>

      {showActions && (
        <div className={styles.restoreActions}>
          <button
            type="button"
            className={styles.restoreBtn}
            onClick={() => onRestore(snapshot, true)}
          >
            <Trash2 size={11} />
            回退并删除之后的快照
          </button>
          <button
            type="button"
            className={styles.restoreBtn}
            onClick={() => onRestore(snapshot, false)}
          >
            <RotateCcw size={11} />
            回退并保留完整历史
          </button>
        </div>
      )}

      {showDiff && diffText && (
        <div
          className={styles.diffPopup}
          style={{ top: diffPos.y, left: diffPos.x, transform: 'translateX(-100%)' }}
        >
          <div className={styles.diffTitle}>变更内容</div>
          <pre className={styles.diffContent}>{diffText}</pre>
        </div>
      )}
    </div>
  )
}
