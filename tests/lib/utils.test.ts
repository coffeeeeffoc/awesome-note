import { describe, it, expect } from 'vitest'
import { nanoid, jsonContentToText, getSiblingSpaces, getDescendantIds } from '../../src/lib/utils'
import type { Space } from '../../src/types'

describe('nanoid', () => {
  it('returns unique ids', () => {
    const a = nanoid()
    const b = nanoid()
    expect(a).not.toBe(b)
    expect(typeof a).toBe('string')
    expect(a.length).toBeGreaterThan(0)
  })
})

describe('jsonContentToText', () => {
  it('extracts text from tiptap json', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    }
    expect(jsonContentToText(content)).toBe('Hello world')
  })

  it('concatenates multiple paragraphs with space', () => {
    const content = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
      ],
    }
    const text = jsonContentToText(content)
    expect(text).toContain('First')
    expect(text).toContain('Second')
  })

  it('returns empty string for empty doc', () => {
    expect(jsonContentToText({ type: 'doc', content: [] })).toBe('')
    expect(jsonContentToText(null)).toBe('')
  })

  it('ignores non-text nodes (images)', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'text' },
            { type: 'awesomeImage', attrs: { imgId: 'abc' } },
          ],
        },
      ],
    }
    expect(jsonContentToText(content)).toBe('text')
  })
})

describe('getSiblingSpaces', () => {
  const spaces: Space[] = [
    { id: '1', name: 'Root A', parentId: null, createdAt: 0, updatedAt: 0 },
    { id: '2', name: 'Root B', parentId: null, createdAt: 0, updatedAt: 0 },
    { id: '3', name: 'Child A1', parentId: '1', createdAt: 0, updatedAt: 0 },
    { id: '4', name: 'Child A2', parentId: '1', createdAt: 0, updatedAt: 0 },
  ]

  it('returns root-level siblings when parentId is null', () => {
    const result = getSiblingSpaces(spaces, null)
    expect(result.map((s) => s.id)).toEqual(['1', '2'])
  })

  it('returns child-level siblings', () => {
    const result = getSiblingSpaces(spaces, '1')
    expect(result.map((s) => s.id)).toEqual(['3', '4'])
  })

  it('excludes self when provided', () => {
    const result = getSiblingSpaces(spaces, null, '1')
    expect(result.map((s) => s.id)).toEqual(['2'])
  })
})

describe('getDescendantIds', () => {
  const spaces: Space[] = [
    { id: '1', name: 'A', parentId: null, createdAt: 0, updatedAt: 0 },
    { id: '2', name: 'B', parentId: '1', createdAt: 0, updatedAt: 0 },
    { id: '3', name: 'C', parentId: '2', createdAt: 0, updatedAt: 0 },
    { id: '4', name: 'D', parentId: null, createdAt: 0, updatedAt: 0 },
  ]

  it('returns all descendant ids recursively', () => {
    const result = getDescendantIds(spaces, '1')
    expect(result).toContain('2')
    expect(result).toContain('3')
    expect(result).not.toContain('4')
  })

  it('returns empty set for leaf node', () => {
    const result = getDescendantIds(spaces, '3')
    expect(result.size).toBe(0)
  })
})
