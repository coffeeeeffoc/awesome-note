import { create } from 'zustand'
import type { AppMode, ViewMode } from '../types'

interface AppState {
  mode: AppMode
  activeSpaceId: string | null // null = "全部笔记"
  activeNoteId: string | null
  viewMode: ViewMode
  leftCollapsed: boolean
  midCollapsed: boolean
  searchQuery: string
  saveStatus: 'saved' | 'saving'
}

interface AppActions {
  setMode(mode: AppMode): void
  setActiveSpace(id: string | null): void
  setActiveNote(id: string | null): void
  setViewMode(mode: ViewMode): void
  setLeftCollapsed(v: boolean): void
  setMidCollapsed(v: boolean): void
  toggleLeftCollapsed(): void
  toggleMidCollapsed(): void
  setSearchQuery(q: string): void
  setSaveStatus(s: 'saved' | 'saving'): void
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  mode: 'popup',
  activeSpaceId: null,
  activeNoteId: null,
  viewMode: 'list',
  leftCollapsed: false,
  midCollapsed: false,
  searchQuery: '',
  saveStatus: 'saved',

  setMode: (mode) => set({ mode }),
  setActiveSpace: (id) => set({ activeSpaceId: id }),
  setActiveNote: (id) => set({ activeNoteId: id }),
  setViewMode: (viewMode) => set({ viewMode }),
  setLeftCollapsed: (v) => set({ leftCollapsed: v }),
  setMidCollapsed: (v) => set({ midCollapsed: v }),
  toggleLeftCollapsed: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
  toggleMidCollapsed: () => set((s) => ({ midCollapsed: !s.midCollapsed })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
}))
