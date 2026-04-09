import type { JSONContent } from '@tiptap/react'

export interface Space {
  id: string
  name: string
  parentId: string | null
  createdAt: number
  updatedAt: number
}

export interface Note {
  id: string
  title: string
  content: JSONContent
  spaceId: string | null
  tagIds: string[]
  createdAt: number
  updatedAt: number
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface NoteImage {
  id: string
  noteId: string
  blob: Blob
  mimeType: string
}

export type ThemeMode = 'system' | 'dark' | 'light'
export type ViewMode = 'list' | 'masonry'
export type AppMode = 'popup' | 'sidepanel' | 'fullpage'

export type SyncMessage =
  | { type: 'NOTE_UPDATED'; id: string }
  | { type: 'NOTE_DELETED'; id: string }
  | { type: 'NOTE_CREATED'; id: string }
  | { type: 'SPACE_CHANGED' }
  | { type: 'TAG_CHANGED' }

export const TAG_COLORS: readonly string[] = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f97316', // orange
  '#ef4444', // red
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#eab308', // yellow
  '#6b7280', // gray
  '#1e293b', // dark
] as const

export interface StorageSchema {
  themeMode: ThemeMode
  viewMode: ViewMode
  lastOpenNoteId: string | null
  lastOpenSpaceId: string | null
  spaceExpandedIds: string[]
  pendingDeleteImages: string[]
  leftCollapsed: boolean
  midCollapsed: boolean
}
