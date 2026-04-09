import { openDB as idbOpen, type IDBPDatabase } from 'idb'
import type { Space, Note, Tag, NoteImage } from '../types'
import type { JSONContent } from '@tiptap/react'
import { nanoid } from './utils'

const DB_VERSION = 1

type AwesomeNoteDB = {
  notes: Note
  spaces: Space
  tags: Tag
  images: NoteImage
}

async function openDB(name = 'awesome-note'): Promise<IDBPDatabase<AwesomeNoteDB>> {
  return idbOpen<AwesomeNoteDB>(name, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('notes')) {
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' })
        notesStore.createIndex('spaceId', 'spaceId')
        notesStore.createIndex('updatedAt', 'updatedAt')
      }
      if (!db.objectStoreNames.contains('spaces')) {
        const spacesStore = db.createObjectStore('spaces', { keyPath: 'id' })
        spacesStore.createIndex('parentId', 'parentId')
      }
      if (!db.objectStoreNames.contains('tags')) {
        const tagsStore = db.createObjectStore('tags', { keyPath: 'id' })
        tagsStore.createIndex('name', 'name')
      }
      if (!db.objectStoreNames.contains('images')) {
        const imagesStore = db.createObjectStore('images', { keyPath: 'id' })
        imagesStore.createIndex('noteId', 'noteId')
      }
    },
  })
}

export { openDB }

// ─── Spaces ──────────────────────────────────────────────────────────────────

export async function getAllSpaces(dbName?: string): Promise<Space[]> {
  const db = await openDB(dbName)
  return db.getAll('spaces')
}

export async function createSpace(
  data: { name: string; parentId: string | null },
  dbName?: string,
): Promise<Space> {
  const db = await openDB(dbName)
  const now = Date.now()
  const space: Space = { id: nanoid(), name: data.name, parentId: data.parentId, createdAt: now, updatedAt: now }
  await db.put('spaces', space)
  return space
}

export async function updateSpace(space: Space, dbName?: string): Promise<void> {
  const db = await openDB(dbName)
  await db.put('spaces', { ...space, updatedAt: Date.now() })
}

export async function deleteSpace(id: string, dbName?: string): Promise<void> {
  const db = await openDB(dbName)
  const tx = db.transaction(['spaces', 'notes'], 'readwrite')

  // Get the space to know its parentId for re-parenting children
  const space = await tx.objectStore('spaces').get(id)
  const newParentId = space?.parentId ?? null

  // Re-parent child spaces
  const childSpaces = await tx.objectStore('spaces').index('parentId').getAll(id)
  for (const child of childSpaces) {
    await tx.objectStore('spaces').put({ ...child, parentId: newParentId, updatedAt: Date.now() })
  }

  // Move notes to parent space
  const notes = await tx.objectStore('notes').index('spaceId').getAll(id)
  for (const note of notes) {
    await tx.objectStore('notes').put({ ...note, spaceId: newParentId, updatedAt: Date.now() })
  }

  await tx.objectStore('spaces').delete(id)
  await tx.done
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function getAllNotes(dbName?: string): Promise<Note[]> {
  const db = await openDB(dbName)
  const notes = await db.getAll('notes')
  return notes.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getNoteById(id: string, dbName?: string): Promise<Note | undefined> {
  const db = await openDB(dbName)
  return db.get('notes', id)
}

export async function createNote(
  data: { title: string; content: JSONContent; spaceId: string | null; tagIds: string[] },
  dbName?: string,
): Promise<Note> {
  const db = await openDB(dbName)
  const now = Date.now()
  const note: Note = { id: nanoid(), ...data, createdAt: now, updatedAt: now }
  await db.put('notes', note)
  return note
}

export async function updateNote(note: Note, dbName?: string): Promise<void> {
  const db = await openDB(dbName)
  await db.put('notes', { ...note, updatedAt: Date.now() })
}

export async function deleteNote(id: string, dbName?: string): Promise<void> {
  const db = await openDB(dbName)
  await db.delete('notes', id)
  await deleteImagesForNote(id, dbName)
}

export async function duplicateNote(id: string, dbName?: string): Promise<Note> {
  const db = await openDB(dbName)
  const original = await db.get('notes', id)
  if (!original) throw new Error(`Note ${id} not found`)

  const newNoteId = nanoid()
  const originalImages = await db.getAllFromIndex('images', 'noteId', id)

  // Copy images with new IDs
  const idMap = new Map<string, string>()
  for (const img of originalImages) {
    const newImgId = nanoid()
    await db.put('images', { ...img, id: newImgId, noteId: newNoteId })
    idMap.set(img.id, newImgId)
  }

  // Remap image IDs in content
  const contentStr = JSON.stringify(original.content).replace(
    /"imgId":"([^"]+)"/g,
    (_, oldId: string) => `"imgId":"${idMap.get(oldId) ?? oldId}"`,
  )

  const now = Date.now()
  const copy: Note = {
    ...original,
    id: newNoteId,
    title: original.title ? `${original.title} (副本)` : '(副本)',
    content: JSON.parse(contentStr) as JSONContent,
    createdAt: now,
    updatedAt: now,
  }
  await db.put('notes', copy)
  return copy
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function getAllTags(dbName?: string): Promise<Tag[]> {
  const db = await openDB(dbName)
  return db.getAll('tags')
}

export async function createTag(data: { name: string; color: string }, dbName?: string): Promise<Tag> {
  const db = await openDB(dbName)
  const tag: Tag = { id: nanoid(), name: data.name, color: data.color, createdAt: Date.now() }
  await db.put('tags', tag)
  return tag
}

export async function updateTag(tag: Tag, dbName?: string): Promise<void> {
  const db = await openDB(dbName)
  await db.put('tags', tag)
}

export async function deleteTag(id: string, dbName?: string): Promise<void> {
  const db = await openDB(dbName)
  // Remove tag from all notes
  const notes = await db.getAll('notes')
  const tx = db.transaction(['notes', 'tags'], 'readwrite')
  for (const note of notes) {
    if (note.tagIds.includes(id)) {
      await tx.objectStore('notes').put({ ...note, tagIds: note.tagIds.filter((tid: string) => tid !== id) })
    }
  }
  await tx.objectStore('tags').delete(id)
  await tx.done
}

// ─── Images ──────────────────────────────────────────────────────────────────

// Internal storage type: store bytes as Uint8Array so structured clone works
// in all environments (jsdom Blob doesn't implement structured serializable interface)
type StoredImage = { id: string; noteId: string; bytes: Uint8Array; mimeType: string }

export async function saveImage(
  data: { noteId: string; blob: Blob; mimeType: string },
  dbName?: string,
): Promise<NoteImage> {
  const db = await openDB(dbName)
  const buf = await data.blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  const stored: StoredImage = { id: nanoid(), noteId: data.noteId, bytes, mimeType: data.mimeType }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).put('images', stored)
  return { id: stored.id, noteId: stored.noteId, blob: new Blob([bytes.buffer as ArrayBuffer], { type: stored.mimeType }), mimeType: stored.mimeType }
}

export async function getImageBlob(id: string, dbName?: string): Promise<Blob | null> {
  const db = await openDB(dbName)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stored = await (db as any).get('images', id) as StoredImage | undefined
  if (!stored) return null
  // Handle both new (bytes: Uint8Array) and legacy (blob: Blob) formats
  if (stored.bytes) return new Blob([stored.bytes.buffer as ArrayBuffer], { type: stored.mimeType })
  const legacy = stored as unknown as NoteImage
  if (legacy.blob instanceof Blob) return legacy.blob
  return null
}

export async function deleteImagesForNote(noteId: string, dbName?: string): Promise<void> {
  const db = await openDB(dbName)
  const images = await db.getAllFromIndex('images', 'noteId', noteId)
  const tx = db.transaction('images', 'readwrite')
  for (const img of images) {
    await tx.store.delete(img.id)
  }
  await tx.done
}

export async function deleteImageById(id: string, dbName?: string): Promise<void> {
  const db = await openDB(dbName)
  await db.delete('images', id)
}
