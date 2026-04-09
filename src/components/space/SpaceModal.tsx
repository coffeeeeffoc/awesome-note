import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { suggestSpaceName } from '../../lib/utils'
import styles from './SpaceModal.module.css'
import type { Space } from '../../types'

interface Props {
  mode: 'add' | 'rename'
  defaultName?: string
  siblings: Space[]
  onConfirm: (name: string) => void
  onClose: () => void
}

export function SpaceModal({ mode, defaultName = '', siblings, onConfirm, onClose }: Props) {
  const [value, setValue] = useState(defaultName)
  const [suggestion, setSuggestion] = useState('')
  const [hasConflict, setHasConflict] = useState(false)

  useEffect(() => {
    const trimmed = value.trim()
    const names = new Set(siblings.map((s) => s.name))
    if (trimmed && names.has(trimmed)) {
      setHasConflict(true)
      setSuggestion(suggestSpaceName(trimmed, siblings))
    } else {
      setHasConflict(false)
      setSuggestion('')
    }
  }, [value, siblings])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = value.trim()
    if (!name) return
    onConfirm(name)
  }

  return (
    <Modal open title={mode === 'add' ? '新建空间' : '重命名空间'} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <input
            autoFocus
            className={styles.input}
            placeholder="空间名称"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-error={hasConflict ? 'true' : undefined}
          />
          {hasConflict && (
            <div className={styles.hint}>
              <span className={styles.conflict}>同级已有同名空间</span>
              <button
                type="button"
                className={styles.suggestion}
                onClick={() => setValue(suggestion)}
              >
                使用建议：{suggestion}
              </button>
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            取消
          </button>
          <button type="submit" className={styles.confirm} disabled={!value.trim()}>
            确认
          </button>
        </div>
      </form>
    </Modal>
  )
}
