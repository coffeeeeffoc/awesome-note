import { useState, useEffect, useCallback } from 'react'
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  duplicateNote,
} from '../lib/db'
import { getSyncBus } from '../lib/sync'
import { jsonContentToText } from '../lib/utils'
import type { Note } from '../types'

export function useNotes(spaceId?: string | null, search?: string) {
  const [notes, setNotes] = useState<Note[]>([])

  const reload = useCallback(async () => {
    let all = await getAllNotes()
    // Filter by space
    if (spaceId !== undefined) {
      if (spaceId === 'unclassified') {
        all = all.filter((n) => n.spaceId === null)
      } else if (spaceId !== null) {
        all = all.filter((n) => n.spaceId === spaceId)
      }
      // null = all notes, no filter
    }
    // Filter by search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      all = all.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          jsonContentToText(n.content).toLowerCase().includes(q),
      )
    }
    setNotes(all)
  }, [spaceId, search])

  useEffect(() => {
    reload()
    const bus = getSyncBus()
    const unsub = bus.onMessage((msg) => {
      if (msg.type === 'NOTE_CREATED' || msg.type === 'NOTE_DELETED') {
        reload()
      } else if (msg.type === 'NOTE_UPDATED') {
        // Targeted refresh: update single note in list
        getNoteById(msg.id).then((updated) => {
          if (updated) {
            setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
          } else {
            reload()
          }
        })
      } else if (msg.type === 'NOTE_TITLE_CHANGED') {
        // Instant title sync without waiting for DB
        setNotes((prev) => prev.map((n) => (n.id === msg.id ? { ...n, title: msg.title } : n)))
      }
    })
    return unsub
  }, [reload])

  async function addNote(spaceId: string | null = null): Promise<Note> {
    const note = await createNote({
      title: '',
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      spaceId,
      tagIds: [],
    })
    getSyncBus().broadcast({ type: 'NOTE_CREATED', id: note.id })
    await reload()
    return note
  }

  async function saveNote(note: Note): Promise<void> {
    await updateNote(note)
    getSyncBus().broadcast({ type: 'NOTE_UPDATED', id: note.id })
    setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)))
  }

  async function removeNote(id: string): Promise<void> {
    await deleteNote(id)
    getSyncBus().broadcast({ type: 'NOTE_DELETED', id })
    await reload()
  }

  async function copyNote(id: string): Promise<Note> {
    const copy = await duplicateNote(id)
    getSyncBus().broadcast({ type: 'NOTE_CREATED', id: copy.id })
    await reload()
    return copy
  }

  return { notes, addNote, saveNote, removeNote, copyNote, reload }
}
