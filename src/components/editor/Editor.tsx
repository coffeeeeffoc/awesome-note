import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { EditorToolbar } from './EditorToolbar'
import { LinkPopover } from './LinkPopover'
import { AwesomeImageExtension } from '../../extensions/AwesomeImage'
import { saveImage, createSnapshot } from '../../lib/db'
import { useAppStore } from '../../store/appStore'
import { useToastStore } from '../ui/Toast'
import styles from './Editor.module.css'
import type { Note } from '../../types'
import type { JSONContent } from '@tiptap/react'

interface Props {
  note: Note
  onSave: (note: Note) => Promise<void>
}

export function Editor({ note, onSave }: Props) {
  const setSaveStatus = useAppStore((s) => s.setSaveStatus)
  const addToast = useToastStore((s) => s.addToast)
  const [showLinkPopover, setShowLinkPopover] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteIdRef = useRef(note.id)
  const lastNoteIdRef = useRef(note.id)

  const triggerSave = useCallback(
    (content: JSONContent, title: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSaveStatus('saving')
      saveTimer.current = setTimeout(async () => {
        await onSave({ ...note, title, content })
        setSaveStatus('saved')
      }, 1000)
    },
    [note, onSave, setSaveStatus],
  )

  // Immediate save + snapshot for Cmd+S
  const handleSaveShortcut = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    const currentContent = editor?.getJSON() ?? note.content
    const currentTitle = titleRef.current
    const updated = { ...note, title: currentTitle, content: currentContent }
    setSaveStatus('saving')
    await onSave(updated)
    setSaveStatus('saved')
    await createSnapshot({
      noteId: note.id,
      title: currentTitle,
      content: currentContent,
      trigger: 'save-shortcut',
    })
    addToast('已保存，快照已添加')
  }, [note, onSave, setSaveStatus, addToast])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      AwesomeImageExtension,
    ],
    content: note.content,
    onUpdate({ editor }) {
      triggerSave(editor.getJSON(), titleRef.current)
    },
    editorProps: {
      handlePaste(view, event) {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const blob = item.getAsFile()
            if (!blob) continue
            saveImage({ noteId: noteIdRef.current, blob, mimeType: item.type }).then((img) => {
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.awesomeImage.create({ imgId: img.id }),
                ),
              )
            })
            return true
          }
        }
        return false
      },
      handleKeyDown(_view, event) {
        // Cmd/Ctrl+S = save + snapshot
        if (event.key === 's' && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
          event.preventDefault()
          handleSaveShortcut()
          return true
        }
        // Shift+Ctrl+V = paste as plain text
        if (event.key === 'v' && event.ctrlKey && event.shiftKey) {
          event.preventDefault()
          navigator.clipboard.readText().then((text) => {
            editor?.chain().focus().insertContent(text).run()
          })
          return true
        }
        return false
      },
    },
  })

  const titleRef = useRef(note.title)

  // Also capture Cmd+S globally (when focus is not in editor, e.g., on title input)
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === 's' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault()
        handleSaveShortcut()
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleSaveShortcut])

  // Sync editor content when note changes
  useEffect(() => {
    noteIdRef.current = note.id
    titleRef.current = note.title
    if (editor && note.id !== lastNoteIdRef.current) {
      lastNoteIdRef.current = note.id
      editor.commands.setContent(note.content)
    }
  }, [note.id, note.content, editor])

  return (
    <div className={styles.container}>
      {editor && (
        <div className={styles.toolbarWrapper}>
          <EditorToolbar
            editor={editor}
            noteId={note.id}
            onLinkClick={() => setShowLinkPopover((v) => !v)}
          />
          {showLinkPopover && (
            <LinkPopover editor={editor} onClose={() => setShowLinkPopover(false)} />
          )}
        </div>
      )}
      <EditorContent editor={editor} className={styles.content} />
    </div>
  )
}
