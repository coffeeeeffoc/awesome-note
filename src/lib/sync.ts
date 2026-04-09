import type { SyncMessage } from '../types'

const CHANNEL_NAME = 'awesome-note-sync'

export interface SyncBus {
  broadcast(message: SyncMessage): void
  onMessage(handler: (message: SyncMessage) => void): () => void
  /** Test helper: simulate receiving a message as if it came from another window */
  _simulateReceive(message: SyncMessage): void
  dispose(): void
}

export function createSyncBus(): SyncBus {
  const channel = new BroadcastChannel(CHANNEL_NAME)
  const handlers = new Set<(msg: SyncMessage) => void>()

  channel.onmessage = (event: MessageEvent) => {
    const msg = event.data as SyncMessage
    handlers.forEach((h) => h(msg))
  }

  return {
    broadcast(message) {
      channel.postMessage(message)
    },
    onMessage(handler) {
      handlers.add(handler)
      return () => handlers.delete(handler)
    },
    _simulateReceive(message) {
      handlers.forEach((h) => h(message))
    },
    dispose() {
      handlers.clear()
      channel.close()
    },
  }
}

// Singleton for production use — each entry point creates one at startup
let _bus: SyncBus | null = null

export function getSyncBus(): SyncBus {
  if (!_bus) {
    _bus = createSyncBus()
  }
  return _bus
}
