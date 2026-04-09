import { useEffect, useState } from 'react'
import { getStorage, setStorage, onStorageChange } from '../lib/storage'
import type { ThemeMode } from '../types'

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'dark') return 'dark'
  if (mode === 'light') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme)
}

export function useTheme() {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system')

  useEffect(() => {
    // Load persisted mode
    getStorage('themeMode').then((mode) => {
      setThemeModeState(mode)
      applyTheme(resolveTheme(mode))
    })

    // Listen for changes from other windows
    const unsub = onStorageChange('themeMode', (newMode) => {
      setThemeModeState(newMode)
      applyTheme(resolveTheme(newMode))
    })

    return unsub
  }, [])

  // React to OS preference changes when in system mode
  useEffect(() => {
    if (themeMode !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(resolveTheme('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeMode])

  function cycleTheme() {
    const next: ThemeMode = themeMode === 'system' ? 'dark' : themeMode === 'dark' ? 'light' : 'system'
    setThemeModeState(next)
    applyTheme(resolveTheme(next))
    setStorage('themeMode', next)
  }

  return { themeMode, cycleTheme }
}
