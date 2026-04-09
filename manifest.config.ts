import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: '随心记',
  version: '1.0.0',
  description: '轻量笔记 — 粘贴图片、管理空间，随时随地记录灵感',
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_popup: 'src/entries/popup/index.html',
    default_icon: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
    },
  },
  side_panel: {
    default_path: 'src/entries/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['storage', 'sidePanel', 'contextMenus', 'windows'],
  commands: {
    _execute_action: {
      suggested_key: { default: 'Alt+N' },
      description: '打开随心记弹窗',
    },
  },
})
