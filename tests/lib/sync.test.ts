import { describe, it, expect } from 'vitest'
import { createSyncBus } from '../../src/lib/sync'
import type { SyncMessage } from '../../src/types'

describe('createSyncBus', () => {
  it('broadcasts messages to other listeners', () => {
    const bus1 = createSyncBus()
    const bus2 = createSyncBus()

    const received: SyncMessage[] = []
    bus2.onMessage((msg) => received.push(msg))

    bus1.broadcast({ type: 'SPACE_CHANGED' })

    expect(received).toHaveLength(1)
    expect(received[0]).toEqual({ type: 'SPACE_CHANGED' })
  })

  it('does not receive own messages', () => {
    const bus = createSyncBus()
    const received: SyncMessage[] = []
    bus.onMessage((msg) => received.push(msg))

    bus.broadcast({ type: 'TAG_CHANGED' })
    // BroadcastChannel mock does NOT deliver to self
    expect(received).toHaveLength(0)
  })

  it('supports NOTE_UPDATED with id', () => {
    const sender = createSyncBus()
    const receiver = createSyncBus()
    const received: SyncMessage[] = []
    receiver.onMessage((msg) => received.push(msg))

    sender.broadcast({ type: 'NOTE_UPDATED', id: 'note-123' })

    expect(received[0]).toEqual({ type: 'NOTE_UPDATED', id: 'note-123' })
  })

  it('supports simulating received messages for testing', () => {
    const bus = createSyncBus()
    const received: SyncMessage[] = []
    bus.onMessage((msg) => received.push(msg))

    bus._simulateReceive({ type: 'NOTE_DELETED', id: 'x' })

    expect(received).toHaveLength(1)
    expect(received[0]).toEqual({ type: 'NOTE_DELETED', id: 'x' })
  })

  it('dispose unregisters handler', () => {
    const sender = createSyncBus()
    const receiver = createSyncBus()
    const received: SyncMessage[] = []
    const dispose = receiver.onMessage((msg) => received.push(msg))

    dispose()
    sender.broadcast({ type: 'SPACE_CHANGED' })

    expect(received).toHaveLength(0)
  })
})
