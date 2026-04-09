import type { StorageSchema } from '../types'

const DEFAULTS: StorageSchema = {
  themeMode: 'system',
  viewMode: 'list',
  lastOpenNoteId: null,
  lastOpenSpaceId: null,
  spaceExpandedIds: [],
  pendingDeleteImages: [],
  leftCollapsed: false,
  midCollapsed: false,
}

export async function getStorage<K extends keyof StorageSchema>(key: K): Promise<StorageSchema[K]> {
  const result = await chrome.storage.local.get(key)
  const value = (result as Record<string, unknown>)[key]
  return value !== undefined ? (value as StorageSchema[K]) : DEFAULTS[key]
}

export async function setStorage<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K],
): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
}

export function onStorageChange<K extends keyof StorageSchema>(
  key: K,
  callback: (newValue: StorageSchema[K]) => void,
): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
    if (key in changes) {
      const change = changes[key]
      if (change !== undefined) {
        callback(change.newValue as StorageSchema[K])
      }
    }
  }
  chrome.storage.local.onChanged.addListener(listener)
  return () => chrome.storage.local.onChanged.removeListener(listener)
}

export async function appendPendingDeleteImage(imgId: string): Promise<void> {
  const existing = await getStorage('pendingDeleteImages')
  await setStorage('pendingDeleteImages', [...existing, imgId])
}

export async function flushPendingDeleteImages(): Promise<string[]> {
  const ids = await getStorage('pendingDeleteImages')
  if (ids.length > 0) {
    await setStorage('pendingDeleteImages', [])
  }
  return ids
}
