# 随心记 (Awesome Note)

轻量级 Chrome 浏览器扩展 — 随时记录灵感，支持富文本、图片、空间管理。

## 功能特性

- **三模式界面**：弹窗（400×580px）、侧边面板、完整页面，数据实时共享
- **富文本编辑**：粘贴图片、上传图片、粘贴富文本、纯文本粘贴（Shift+Ctrl+V）、插入链接
- **空间管理**：无限层级嵌套，同级重名智能提示并建议可用名称，空间笔记数预览
- **笔记功能**：标题、标签、移动到空间、创建副本，1s 防抖自动保存，关闭不丢失
- **列表 / 瀑布流**：中栏视图一键切换，全局搜索实时高亮
- **双主题**：跟随系统 / 强制深色 / 强制亮色三档循环切换
- **本地存储**：IndexedDB 存储笔记和图片（Blob），chrome.storage 存储 UI 偏好

## 技术栈

| 层级 | 技术 |
|------|------|
| 构建 | Vite 5 + `@crxjs/vite-plugin` |
| UI | React 18 + TypeScript (strict) |
| 编辑器 | Tiptap 2（StarterKit + Link + 自定义 AwesomeImage） |
| 状态 | Zustand |
| 存储 | IndexedDB (`idb`) + `chrome.storage.local` |
| 样式 | CSS Modules + CSS 变量 |
| 图标 | Lucide React |
| 测试 | Vitest + React Testing Library + fake-indexeddb |

## 开发

```bash
npm install
npm run dev     # 开发模式（HMR）
npm test        # 运行测试
npm run build   # 生产构建
```

构建产物在 `dist/`，在 Chrome 扩展管理页面以"加载已解压的扩展程序"方式加载。

## 项目结构

```
src/
├── entries/          # 三个入口（popup / sidepanel / fullpage）
├── components/
│   ├── layout/       # AppShell、TopBar、SpacePanel、NoteListPanel、EditorPanel
│   ├── space/        # SpaceTree、SpaceItem、SpaceModal
│   ├── note/         # NoteCard、NoteListRow
│   ├── editor/       # Editor（Tiptap）、EditorToolbar、LinkPopover
│   ├── tag/          # TagBadge
│   └── ui/           # IconButton、Modal、ContextMenu
├── extensions/       # AwesomeImage Tiptap 扩展
├── hooks/            # useSpaces、useNotes、useTags、useTheme
├── store/            # appStore（Zustand）
├── lib/              # db.ts、sync.ts、storage.ts、utils.ts
├── types/            # 全局类型定义
└── styles/           # tokens.css、reset.css、global.css
```
