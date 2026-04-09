import { useState, useEffect, useCallback } from 'react'
import {
  getAllSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
} from '../lib/db'
import { getSyncBus } from '../lib/sync'
import { getStorage, setStorage } from '../lib/storage'
import { getSiblingSpaces, suggestSpaceName } from '../lib/utils'
import type { Space } from '../types'

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const reload = useCallback(async () => {
    const all = await getAllSpaces()
    setSpaces(all)
  }, [])

  useEffect(() => {
    reload()
    // Restore expanded state
    getStorage('spaceExpandedIds').then((ids) => setExpandedIds(new Set(ids)))

    const bus = getSyncBus()
    const unsub = bus.onMessage((msg) => {
      if (msg.type === 'SPACE_CHANGED') reload()
    })
    return unsub
  }, [reload])

  async function addSpace(name: string, parentId: string | null): Promise<Space> {
    const siblings = getSiblingSpaces(spaces, parentId)
    const safeName = suggestSpaceName(name, siblings)
    const space = await createSpace({ name: safeName, parentId })
    getSyncBus().broadcast({ type: 'SPACE_CHANGED' })
    await reload()
    return space
  }

  async function renameSpace(id: string, name: string): Promise<void> {
    const space = spaces.find((s) => s.id === id)
    if (!space) return
    const siblings = getSiblingSpaces(spaces, space.parentId, id)
    const safeName = suggestSpaceName(name, siblings)
    await updateSpace({ ...space, name: safeName })
    getSyncBus().broadcast({ type: 'SPACE_CHANGED' })
    await reload()
  }

  async function moveSpace(id: string, newParentId: string | null): Promise<void> {
    const space = spaces.find((s) => s.id === id)
    if (!space) return
    await updateSpace({ ...space, parentId: newParentId })
    getSyncBus().broadcast({ type: 'SPACE_CHANGED' })
    await reload()
  }

  async function removeSpace(id: string): Promise<void> {
    await deleteSpace(id)
    getSyncBus().broadcast({ type: 'SPACE_CHANGED' })
    await reload()
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      setStorage('spaceExpandedIds', [...next])
      return next
    })
  }

  return {
    spaces,
    expandedIds,
    addSpace,
    renameSpace,
    moveSpace,
    removeSpace,
    toggleExpanded,
    reload,
  }
}
