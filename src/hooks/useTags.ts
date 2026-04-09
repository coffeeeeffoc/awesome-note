import { useState, useEffect, useCallback } from 'react'
import { getAllTags, createTag, updateTag, deleteTag } from '../lib/db'
import { getSyncBus } from '../lib/sync'
import type { Tag } from '../types'
import { TAG_COLORS } from '../types'

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])

  const reload = useCallback(async () => {
    setTags(await getAllTags())
  }, [])

  useEffect(() => {
    reload()
    const bus = getSyncBus()
    const unsub = bus.onMessage((msg) => {
      if (msg.type === 'TAG_CHANGED') reload()
    })
    return unsub
  }, [reload])

  async function addTag(name: string, color = TAG_COLORS[0]): Promise<Tag> {
    const tag = await createTag({ name, color })
    getSyncBus().broadcast({ type: 'TAG_CHANGED' })
    await reload()
    return tag
  }

  async function editTag(id: string, name: string, color: string): Promise<void> {
    const tag = tags.find((t) => t.id === id)
    if (!tag) return
    await updateTag({ ...tag, name, color })
    getSyncBus().broadcast({ type: 'TAG_CHANGED' })
    await reload()
  }

  async function removeTag(id: string): Promise<void> {
    await deleteTag(id)
    getSyncBus().broadcast({ type: 'TAG_CHANGED' })
    await reload()
  }

  return { tags, addTag, editTag, removeTag, reload }
}
