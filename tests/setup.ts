/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { vi, afterEach } from 'vitest'

// Mock chrome APIs
const chromeMock = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
  runtime: {
    id: 'test-extension-id',
    lastError: null,
  },
}

Object.defineProperty(globalThis, 'chrome', {
  value: chromeMock,
  writable: true,
})

// BroadcastChannel mock
class BroadcastChannelMock {
  name: string
  onmessage: ((ev: MessageEvent) => void) | null = null
  static channels = new Map<string, BroadcastChannelMock[]>()

  constructor(name: string) {
    this.name = name
    const existing = BroadcastChannelMock.channels.get(name) ?? []
    BroadcastChannelMock.channels.set(name, [...existing, this])
  }

  postMessage(data: unknown) {
    const peers = BroadcastChannelMock.channels.get(this.name) ?? []
    peers.forEach((ch) => {
      if (ch !== this && ch.onmessage) {
        ch.onmessage(new MessageEvent('message', { data }))
      }
    })
  }

  close() {
    const peers = BroadcastChannelMock.channels.get(this.name) ?? []
    BroadcastChannelMock.channels.set(
      this.name,
      peers.filter((ch) => ch !== this),
    )
  }

  _simulateReceive(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }))
    }
  }
}

Object.defineProperty(globalThis, 'BroadcastChannel', {
  value: BroadcastChannelMock,
  writable: true,
})

// Reset between tests
afterEach(() => {
  BroadcastChannelMock.channels.clear()
  vi.clearAllMocks()
})
