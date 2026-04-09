import { describe, it, expect, beforeEach } from 'vitest'
import {
  openDB as _openDB,
  getAllSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  duplicateNote,
  getAllTags,
  createTag,
  deleteTag,
  saveImage,
  getImageBlob,
  deleteImagesForNote,
} from '../../src/lib/db'

// Reset DB before each test
let dbName = ''
beforeEach(async () => {
  dbName = `test-${Math.random().toString(36).slice(2)}`
})

describe('spaces', () => {
  it('creates and retrieves spaces', async () => {
    const space = await createSpace({ name: 'Work', parentId: null }, dbName)
    expect(space.id).toBeTruthy()
    expect(space.name).toBe('Work')

    const all = await getAllSpaces(dbName)
    expect(all.some((s) => s.id === space.id)).toBe(true)
  })

  it('updates space name', async () => {
    const space = await createSpace({ name: 'Old', parentId: null }, dbName)
    await updateSpace({ ...space, name: 'New' }, dbName)

    const all = await getAllSpaces(dbName)
    const updated = all.find((s) => s.id === space.id)
    expect(updated?.name).toBe('New')
  })

  it('deletes space and re-parents children', async () => {
    const parent = await createSpace({ name: 'Parent', parentId: null }, dbName)
    const child = await createSpace({ name: 'Child', parentId: parent.id }, dbName)
    const note = await createNote(
      { title: 'Note', content: { type: 'doc', content: [] }, spaceId: parent.id, tagIds: [] },
      dbName,
    )

    await deleteSpace(parent.id, dbName)

    const spaces = await getAllSpaces(dbName)
    const updatedChild = spaces.find((s) => s.id === child.id)
    expect(updatedChild?.parentId).toBeNull()

    const notes = await getAllNotes(dbName)
    const updatedNote = notes.find((n) => n.id === note.id)
    expect(updatedNote?.spaceId).toBeNull()
  })
})

describe('notes', () => {
  it('creates and retrieves notes', async () => {
    const note = await createNote(
      { title: 'Test', content: { type: 'doc', content: [] }, spaceId: null, tagIds: [] },
      dbName,
    )
    expect(note.id).toBeTruthy()

    const fetched = await getNoteById(note.id, dbName)
    expect(fetched?.title).toBe('Test')
  })

  it('updates note', async () => {
    const note = await createNote(
      { title: 'Old', content: { type: 'doc', content: [] }, spaceId: null, tagIds: [] },
      dbName,
    )
    await updateNote({ ...note, title: 'New' }, dbName)

    const fetched = await getNoteById(note.id, dbName)
    expect(fetched?.title).toBe('New')
  })

  it('deletes note and its images', async () => {
    const note = await createNote(
      { title: 'T', content: { type: 'doc', content: [] }, spaceId: null, tagIds: [] },
      dbName,
    )
    await saveImage({ noteId: note.id, blob: new Blob(['x']), mimeType: 'image/png' }, dbName)

    await deleteNote(note.id, dbName)

    const fetched = await getNoteById(note.id, dbName)
    expect(fetched).toBeUndefined()
  })
})

describe('duplicateNote', () => {
  it('creates a copy with (副本) suffix and new image IDs', async () => {
    const original = await createNote(
      {
        title: 'Original',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'hello' }],
            },
          ],
        },
        spaceId: null,
        tagIds: [],
      },
      dbName,
    )

    const imgResult = await saveImage(
      { noteId: original.id, blob: new Blob(['img']), mimeType: 'image/png' },
      dbName,
    )

    // Embed image ID into content
    await updateNote(
      {
        ...original,
        content: {
          type: 'doc',
          content: [
            {
              type: 'awesomeImage',
              attrs: { imgId: imgResult.id, width: 100, height: 100 },
            },
          ],
        },
      },
      dbName,
    )

    const copy = await duplicateNote(original.id, dbName)
    expect(copy.title).toBe('Original (副本)')
    expect(copy.id).not.toBe(original.id)

    // Image should reference new ID, not original
    const contentStr = JSON.stringify(copy.content)
    expect(contentStr).not.toContain(imgResult.id)
  })
})

describe('tags', () => {
  it('creates and deletes tags', async () => {
    const tag = await createTag({ name: 'urgent', color: '#ff0000' }, dbName)
    expect(tag.id).toBeTruthy()

    const all = await getAllTags(dbName)
    expect(all.some((t) => t.id === tag.id)).toBe(true)

    await deleteTag(tag.id, dbName)
    const afterDelete = await getAllTags(dbName)
    expect(afterDelete.some((t) => t.id === tag.id)).toBe(false)
  })
})

describe('images', () => {
  it('saves and retrieves image blob', async () => {
    const note = await createNote(
      { title: 'T', content: { type: 'doc', content: [] }, spaceId: null, tagIds: [] },
      dbName,
    )
    const blob = new Blob(['test image data'], { type: 'image/png' })
    const img = await saveImage({ noteId: note.id, blob, mimeType: 'image/png' }, dbName)

    const fetched = await getImageBlob(img.id, dbName)
    expect(fetched).not.toBeNull()
    expect(fetched!.size).toBe(blob.size)
  })

  it('deleteImagesForNote removes all images for a note', async () => {
    const note = await createNote(
      { title: 'T', content: { type: 'doc', content: [] }, spaceId: null, tagIds: [] },
      dbName,
    )
    const img1 = await saveImage({ noteId: note.id, blob: new Blob(['a']), mimeType: 'image/png' }, dbName)
    const img2 = await saveImage({ noteId: note.id, blob: new Blob(['b']), mimeType: 'image/png' }, dbName)

    await deleteImagesForNote(note.id, dbName)

    expect(await getImageBlob(img1.id, dbName)).toBeNull()
    expect(await getImageBlob(img2.id, dbName)).toBeNull()
  })
})
