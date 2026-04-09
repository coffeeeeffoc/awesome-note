import { useState, useRef } from 'react'
import {
  BookOpen,
  Search,
  X,
  PanelLeft,
  PanelRight,
  LayoutList,
  LayoutGrid,
  Plus,
  Sun,
  Moon,
  Monitor,
  SidebarOpen,
  Maximize2,
} from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { useAppStore } from '../../store/appStore'
import { useTheme } from '../../hooks/useTheme'
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

export function TopBar({ mode }: Props) {
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const {
    searchQuery, setSearchQuery,
    viewMode, setViewMode,
    leftCollapsed, toggleLeftCollapsed,
    midCollapsed, toggleMidCollapsed,
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

  function openSidePanel() {
    // Background service worker handles windowId lookup and sidePanel.open()
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })
  }

  function openFullPage() {
    const url = chrome.runtime.getURL('src/entries/fullpage/index.html')
    window.open(url, '_blank')
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
            <PanelRight size={14} />
          </IconButton>
        )}

        {mode !== 'sidepanel' && (
          <IconButton label="侧边面板" onClick={openSidePanel}>
            <SidebarOpen size={14} />
          </IconButton>
        )}
        {mode !== 'fullpage' && (
          <IconButton label="完整页面" onClick={openFullPage}>
            <Maximize2 size={14} />
          </IconButton>
        )}

        {/* Collapse left panel */}
        {mode !== 'popup' && (
          <IconButton
            label={leftCollapsed ? '展开空间栏' : '折叠空间栏'}
            active={leftCollapsed}
            onClick={toggleLeftCollapsed}
          >
            <PanelLeft size={14} />
          </IconButton>
        )}

        {/* Collapse mid panel */}
        <IconButton
          label={midCollapsed ? '展开列表栏' : '折叠列表栏'}
          active={midCollapsed}
          onClick={toggleMidCollapsed}
        >
          <PanelRight size={14} />
        </IconButton>

        {/* View mode toggle */}
        <IconButton
          label={viewMode === 'list' ? '切换为瀑布流' : '切换为列表'}
          active={viewMode === 'masonry'}
          onClick={() => setViewMode(viewMode === 'list' ? 'masonry' : 'list')}
        >
          {viewMode === 'list' ? <LayoutGrid size={14} /> : <LayoutList size={14} />}
        </IconButton>

        {/* New note */}
        <IconButton label="新建笔记">
          <Plus size={14} />
        </IconButton>

        {/* Theme */}
        <IconButton label={THEME_LABELS[themeMode]} onClick={cycleTheme}>
          {THEME_ICONS[themeMode]}
        </IconButton>
      </div>
    </div>
  )
}
