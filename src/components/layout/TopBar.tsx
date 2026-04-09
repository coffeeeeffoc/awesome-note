import { useState, useRef } from 'react'
import {
  BookOpen,
  Search,
  X,
  PanelLeft,
  Sun,
  Moon,
  Monitor,
  SidebarOpen,
  Maximize2,
} from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { useAppStore } from '../../store/appStore'
import { useTheme } from '../../hooks/useTheme'
import { setStorage } from '../../lib/storage'
import styles from './TopBar.module.css'
import type { AppMode } from '../../types'

const THEME_ICONS = {
  system: <Monitor size={14} />,
  dark: <Moon size={14} />,
  light: <Sun size={14} />,
}

const THEME_LABELS = {
  system: '跟随系统',
  dark: '深色模式',
  light: '亮色模式',
}

interface Props {
  mode: AppMode
}

/** Persist current active state so the target panel can restore it */
async function persistActiveState() {
  const { activeNoteId, activeSpaceId } = useAppStore.getState()
  await setStorage('lastOpenNoteId', activeNoteId)
  await setStorage('lastOpenSpaceId', activeSpaceId)
}

export function TopBar({ mode }: Props) {
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const {
    searchQuery, setSearchQuery,
    leftCollapsed, toggleLeftCollapsed,
    activeNoteId, setActiveNote,
  } = useAppStore()
  const { themeMode, cycleTheme } = useTheme()

  function openSearch() {
    setSearchOpen(true)
    setTimeout(() => searchRef.current?.focus(), 0)
  }

  function closeSearch() {
    setSearchOpen(false)
    setSearchQuery('')
  }

  async function openSidePanel() {
    await persistActiveState()
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })
    if (mode === 'popup') {
      setTimeout(() => window.close(), 200)
    }
  }

  async function openFullPage() {
    await persistActiveState()
    const url = chrome.runtime.getURL('src/entries/fullpage/index.html')
    window.open(url, '_blank')
    if (mode === 'popup') {
      setTimeout(() => window.close(), 200)
    } else if (mode === 'sidepanel') {
      chrome.runtime.sendMessage({ type: 'CLOSE_SIDE_PANEL' })
    }
  }

  return (
    <div className={styles.bar} style={{ gridArea: 'topbar' }}>
      {/* Logo */}
      <div className={styles.logo}>
        <BookOpen size={16} />
        {!searchOpen && <span className={styles.logoText}>随心记</span>}
      </div>

      {/* Search */}
      {searchOpen ? (
        <div className={styles.searchBox}>
          <Search size={13} className={styles.searchIcon} />
          <input
            ref={searchRef}
            className={styles.searchInput}
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <IconButton label="关闭搜索" size="sm" onClick={closeSearch}>
            <X size={13} />
          </IconButton>
        </div>
      ) : (
        <IconButton label="搜索" onClick={openSearch}>
          <Search size={14} />
        </IconButton>
      )}

      <div className={styles.spacer} />

      {/* Right actions */}
      <div className={styles.actions}>
        {/* Back button in popup note view */}
        {mode === 'popup' && activeNoteId && (
          <IconButton label="返回列表" onClick={() => setActiveNote(null)}>
            <PanelLeft size={14} />
          </IconButton>
        )}

        {mode !== 'sidepanel' && (
          <IconButton label="在侧边面板打开" onClick={openSidePanel}>
            <SidebarOpen size={14} />
          </IconButton>
        )}
        {mode !== 'fullpage' && (
          <IconButton label="在完整页面打开" onClick={openFullPage}>
            <Maximize2 size={14} />
          </IconButton>
        )}

        {/* Collapse left panel */}
        {mode !== 'popup' && (
          <IconButton
            label={leftCollapsed ? '展开左侧栏' : '折叠左侧栏'}
            active={leftCollapsed}
            onClick={toggleLeftCollapsed}
          >
            <PanelLeft size={14} />
          </IconButton>
        )}

        {/* Theme */}
        <IconButton label={THEME_LABELS[themeMode]} onClick={cycleTheme}>
          {THEME_ICONS[themeMode]}
        </IconButton>
      </div>
    </div>
  )
}
