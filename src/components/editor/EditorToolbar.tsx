import { useRef } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Heading2, List, ListOrdered, Code,
  Quote, Link2, Image, Minus
} from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { saveImage } from '../../lib/db'
import styles from './EditorToolbar.module.css'

interface Props {
  editor: Editor
  noteId: string
  onLinkClick: () => void
}

export function EditorToolbar({ editor, noteId, onLinkClick }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(file: File) {
    const img = await saveImage({ noteId, blob: file, mimeType: file.type })
    editor.chain().focus().insertAwesomeImage(img.id).run()
  }

  return (
    <div className={styles.bar}>
      <div className={styles.group}>
        <IconButton
          label="加粗"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={14} />
        </IconButton>
        <IconButton
          label="斜体"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={14} />
        </IconButton>
        <IconButton
          label="标题"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={14} />
        </IconButton>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <IconButton
          label="无序列表"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={14} />
        </IconButton>
        <IconButton
          label="有序列表"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={14} />
        </IconButton>
        <IconButton
          label="代码块"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code size={14} />
        </IconButton>
        <IconButton
          label="引用"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={14} />
        </IconButton>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <IconButton label="插入链接" onClick={onLinkClick} active={editor.isActive('link')}>
          <Link2 size={14} />
        </IconButton>
        <IconButton label="上传图片" onClick={() => fileRef.current?.click()}>
          <Image size={14} />
        </IconButton>
        <IconButton
          label="分隔线"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={14} />
        </IconButton>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className={styles.hidden}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageUpload(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
