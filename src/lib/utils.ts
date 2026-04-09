import type { JSONContent } from '@tiptap/react'
import type { Space } from '../types'

let _counter = 0

/** Lightweight nanoid — 12-char URL-safe random ID */
export function nanoid(): string {
  const arr = crypto.getRandomValues(new Uint8Array(9))
  _counter++
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, 12)
}

/** Extract plain text from Tiptap JSON content */
export function jsonContentToText(content: JSONContent | null | undefined): string {
  if (!content) return ''

  const parts: string[] = []

  function walk(node: JSONContent) {
    if (node.type === 'text' && typeof node.text === 'string') {
      parts.push(node.text)
    }
    if (node.content) {
      for (const child of node.content) {
        walk(child)
      }
    }
  }

  walk(content)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/** Format a timestamp as a relative time string */
export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  if (s < 60) return '刚刚'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

/** Format a timestamp as absolute time string */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  if (sameDay) return time
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' + time
}

/** Simple line-level diff between two texts. Returns array of {type, text} */
export function simpleDiff(
  oldText: string,
  newText: string,
): Array<{ type: 'add' | 'remove' | 'same'; text: string }> {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result: Array<{ type: 'add' | 'remove' | 'same'; text: string }> = []

  const maxLen = Math.max(oldLines.length, newLines.length)
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i]
    const n = newLines[i]
    if (o === undefined) {
      result.push({ type: 'add', text: n })
    } else if (n === undefined) {
      result.push({ type: 'remove', text: o })
    } else if (o === n) {
      result.push({ type: 'same', text: o })
    } else {
      result.push({ type: 'remove', text: o })
      result.push({ type: 'add', text: n })
    }
  }
  return result
}

/** Get all spaces sharing the same parentId (siblings). Optionally exclude self. */
export function getSiblingSpaces(spaces: Space[], parentId: string | null, excludeId?: string): Space[] {
  return spaces.filter(
    (s) => s.parentId === parentId && (excludeId === undefined || s.id !== excludeId),
  )
}

/** BFS to collect all descendant IDs of a space */
export function getDescendantIds(spaces: Space[], rootId: string): Set<string> {
  const result = new Set<string>()
  const queue: string[] = [rootId]

  while (queue.length > 0) {
    const id = queue.shift()!
    const children = spaces.filter((s) => s.parentId === id)
    for (const child of children) {
      result.add(child.id)
      queue.push(child.id)
    }
  }

  return result
}

/** Generate a non-colliding space name suggestion */
export function suggestSpaceName(baseName: string, siblings: Space[]): string {
  const names = new Set(siblings.map((s) => s.name))
  if (!names.has(baseName)) return baseName

  const suffix = nanoid().slice(0, 4)
  let candidate = `${baseName} (copy-${suffix})`
  let i = 2
  while (names.has(candidate)) {
    candidate = `${baseName} (copy-${suffix}-${i++})`
  }
  return candidate
}
