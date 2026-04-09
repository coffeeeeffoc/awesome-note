import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useEffect, useState } from 'react'
import { Loader2, ImageOff } from 'lucide-react'
import { getImageBlob } from '../lib/db'
import { appendPendingDeleteImage } from '../lib/storage'
import styles from './AwesomeImage.module.css'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    awesomeImage: {
      insertAwesomeImage: (imgId: string) => ReturnType
    }
  }
}

function AwesomeImageView({ node }: NodeViewProps) {
  const imgId = node.attrs.imgId as string
  const width = node.attrs.width as number | null
  const height = node.attrs.height as number | null
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let url: string | null = null

    getImageBlob(imgId)
      .then((blob) => {
        if (!blob) {
          setError(true)
          return
        }
        url = URL.createObjectURL(blob)
        setSrc(url)
      })
      .catch(() => setError(true))

    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [imgId])

  return (
    <NodeViewWrapper className={styles.wrapper} data-drag-handle>
      {!src && !error && (
        <div
          className={styles.skeleton}
          style={{ width: width ?? 300, height: height ?? 200 }}
        >
          <Loader2 size={20} className={styles.spin} />
        </div>
      )}
      {error && (
        <div className={styles.error}>
          <ImageOff size={20} />
          <span>图片加载失败</span>
        </div>
      )}
      {src && (
        <img
          src={src}
          alt=""
          className={styles.img}
          draggable={false}
          style={width ? { width } : undefined}
        />
      )}
    </NodeViewWrapper>
  )
}

export const AwesomeImageExtension = Node.create({
  name: 'awesomeImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      imgId: { default: null },
      width: { default: null },
      height: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'awesome-image' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['awesome-image', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AwesomeImageView)
  },

  addCommands() {
    return {
      insertAwesomeImage:
        (imgId) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { imgId },
          })
        },
    }
  },

  onDestroy() {
    // When a node is removed from the doc, queue for cleanup
    const imgId = this.options?.imgId as string | undefined
    if (imgId) {
      appendPendingDeleteImage(imgId)
    }
  },
})
