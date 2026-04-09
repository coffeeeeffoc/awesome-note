import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { ExternalLink, Trash2 } from 'lucide-react'
import styles from './LinkPopover.module.css'

interface Props {
  editor: Editor
  onClose: () => void
}

export function LinkPopover({ editor, onClose }: Props) {
  const existing = editor.getAttributes('link').href as string | undefined
  const [url, setUrl] = useState(existing ?? '')

  function applyLink(e: React.FormEvent) {
    e.preventDefault()
    const href = url.trim()
    if (!href) return
    editor.chain().focus().setLink({ href, target: '_blank', rel: 'noopener noreferrer' }).run()
    onClose()
  }

  function removeLink() {
    editor.chain().focus().unsetLink().run()
    onClose()
  }

  return (
    <div className={styles.popover}>
      <form onSubmit={applyLink} className={styles.form}>
        <input
          autoFocus
          className={styles.input}
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" className={styles.apply}>
          <ExternalLink size={13} />
          应用
        </button>
        {existing && (
          <button type="button" className={styles.remove} onClick={removeLink}>
            <Trash2 size={13} />
          </button>
        )}
      </form>
    </div>
  )
}
