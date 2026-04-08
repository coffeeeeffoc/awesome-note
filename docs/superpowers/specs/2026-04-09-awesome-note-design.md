# 随心记 (awesome-note) — Chrome 扩展设计文档

**日期：** 2026-04-09  
**状态：** 已确认  
**仓库：** `coffeeeeffoc/awesome-note`（新建）

---

## 1. 产品概述

随心记是一个轻量级 Chrome 浏览器扩展，支持三种界面模式（弹窗、侧边面板、完整页面），帮助用户随时记录文字、图片、链接等内容，并通过空间（嵌套文件夹）和标签进行组织管理。数据本地存储，即时保存，随时关闭不丢失。

---

## 2. 技术栈

| 层级 | 选型 |
|------|------|
| 构建工具 | Vite 5 + `@crxjs/vite-plugin` |
| UI 框架 | React 18 + TypeScript |
| 富文本编辑器 | Tiptap 2（StarterKit + Link + 自定义 AwesomeImage 扩展） |
| 状态管理 | Zustand |
| 数据持久化 | IndexedDB（via `idb`）+ `chrome.storage.local` |
| 样式 | CSS Modules + CSS 变量双主题 |
| 图标 | Lucide React |
| Chrome 扩展 | Manifest V3，Side Panel API |

---

## 3. 项目结构

```
awesome-note/
├── manifest.config.ts
├── vite.config.ts
├── src/
│   ├── entries/
│   │   ├── popup/              # 弹窗入口（400×580px）
│   │   ├── sidepanel/          # 侧边面板入口
│   │   └── fullpage/           # 完整页面入口
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx    # 三栏骨架 + 折叠逻辑
│   │   │   ├── SpacePanel.tsx  # 左栏：空间树 + 标签
│   │   │   ├── NoteListPanel.tsx # 中栏：列表/瀑布流切换
│   │   │   └── EditorPanel.tsx # 右栏：Tiptap 编辑器
│   │   ├── space/
│   │   ├── note/
│   │   ├── editor/
│   │   ├── tag/
│   │   └── ui/
│   ├── hooks/
│   │   ├── useNotes.ts
│   │   ├── useSpaces.ts
│   │   ├── useTags.ts
│   │   └── useTheme.ts
│   ├── store/
│   │   └── appStore.ts
│   ├── lib/
│   │   ├── db.ts
│   │   ├── storage.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
└── public/
    └── icons/
```

---

## 4. 数据模型

```typescript
interface Space {
  id: string
  name: string
  parentId: string | null   // null = 根级
  createdAt: number
  updatedAt: number
}

interface Note {
  id: string
  title: string
  content: JSONContent       // Tiptap JSON 格式
  spaceId: string | null
  tagIds: string[]
  createdAt: number
  updatedAt: number
}

interface Tag {
  id: string
  name: string
  color: string              // 预设调色板中的颜色值
  createdAt: number
}

interface NoteImage {
  id: string                 // 同时作为图片节点引用 key（img://uuid）
  noteId: string
  blob: Blob
  mimeType: string
}
```

### IndexedDB（db: `awesome-note`）

| Store | Key | Indexes |
|-------|-----|---------|
| `notes` | `id` | `spaceId`, `updatedAt` |
| `spaces` | `id` | `parentId` |
| `tags` | `id` | `name` |
| `images` | `id` | `noteId` |

### 图片存储策略

图片以原始 `Blob` 存入 IndexedDB（避免 base64 膨胀 33%）。Tiptap image 节点的 `src` 存图片 ID（`img://uuid`），渲染时通过自定义 `AwesomeImage` 扩展动态调用 `URL.createObjectURL(blob)` 生成临时 URL 显示。组件卸载时调用 `URL.revokeObjectURL()` 释放内存。

---

## 5. 三模式界面

### 5.1 模式定义

| 模式 | 入口 | 尺寸 |
|------|------|------|
| 弹窗（Popup） | 点击工具栏图标 | 400 × 580px |
| 侧边面板（Side Panel） | 通过右键菜单或顶栏按钮打开 | 380px 宽，全屏高 |
| 完整页面（Full Page） | 从弹窗/侧面板点击展开按钮 | 100vw × 100vh |

### 5.2 面板折叠行为

| 模式 | 左栏（空间树）| 中栏（笔记列表）| 右栏（编辑器）|
|------|-------------|---------------|-------------|
| 弹窗 | 默认折叠，可展开为 overlay | 默认可见 | 打开笔记时全宽覆盖中栏 |
| 侧边面板 | 默认展开，可折叠 | 默认可见，**可折叠** | 占据剩余空间 |
| 完整页面 | 220px，可折叠 | 280px，可折叠 | 剩余全部空间 |

### 5.3 顶部工具栏（所有模式共享）

从左到右：
1. Logo + 应用名称
2. 搜索框（完整页面/侧面板展开，弹窗为图标点击展开）
3. 右侧图标组：
   - 切换侧边面板 / 完整页面
   - 折叠左栏 / 折叠中栏
   - 列表视图 / 瀑布流视图切换
   - 新建笔记
   - 主题切换（跟随系统 / 强制深色 / 强制亮色循环）

---

## 6. 功能详细设计

### 6.1 空间管理

- 空间树递归渲染，支持无限层级嵌套
- 展开/折叠：点击箭头图标切换子空间可见性，状态存 `chrome.storage.local`
- 新建/重命名：
  - 实时检测同级同名：有冲突 → 红色提示 + 自动建议名称（追加 ` (copy-xxxx)` 后缀）
  - 用户可在建议名称上继续修改
- 每个空间节点右侧显示直属笔记数（不含子空间）
- 右键菜单：重命名、新建子空间、移动到、删除
  - 删除空间时，直属笔记移至其父空间（或根级），子空间递归同步

### 6.2 笔记列表面板

**列表视图（默认）**
- 每行显示：标题、内容摘要（纯文本前 80 字）、标签、更新时间
- 按 `updatedAt` 降序排列

**瀑布流视图**
- 卡片网格，宽度自适应列数（完整页面 3 列，侧面板 2 列，弹窗 2 列）
- 卡片高度随内容自然伸展（masonry 布局，CSS columns 实现）
- 卡片内容：标题、文本预览、缩略图（若有图片则显示首张）、标签

**搜索**
- 实时搜索（debounce 300ms）标题 + 内容纯文本
- 搜索时高亮匹配词

### 6.3 编辑器

**打开行为**
- 点击列表项/卡片 → 右栏切换为编辑器（URL hash 记录 `#note/{id}`，支持刷新恢复）
- 弹窗模式：中栏被编辑器全宽替换，顶部有"返回列表"按钮

**自动保存**
- 标题和内容变化后 debounce 1s 触发保存
- 顶部保存状态指示：圆点灰色=已保存，橙色动画=保存中

**元信息栏（编辑器顶部）**
- 当前所属空间（可点击更改 → 弹出空间选择器）
- 标签列表（可点击 + 号添加/删除标签）
- 操作菜单（三点图标）：创建副本、删除笔记

**创建副本**
- 标题自动追加 ` (副本)`
- 内容完整复制（包含图片——图片 Blob 重新写入 IndexedDB 生成新 ID）
- 属于同一空间，同样的标签

### 6.4 Tiptap 扩展列表

| 功能 | 实现 |
|------|------|
| 基础格式 | `StarterKit`（Bold/Italic/Heading/BulletList/OrderedList/CodeBlock/Blockquote） |
| 链接 | `Link`（点击显示 popover 编辑/删除 URL，`rel="noopener"` 默认） |
| 图片 | 自定义 `AwesomeImage` 扩展（Blob src 解析、拖拽调整大小） |
| 粘贴图片 | 拦截 `paste` 事件 → 检测 `image/*` clipboard item → 存 IndexedDB → 插入节点 |
| 纯文本粘贴 | Shift+Ctrl+V 剥除所有格式粘贴为纯文本 |
| 图片上传 | 工具栏图标 → `<input type="file" accept="image/*">` → 存 IndexedDB → 插入 |

### 6.5 主题系统

- 根节点 `data-theme="dark"/"light"` 驱动所有 CSS 变量
- 核心变量（约 20 个）：`--bg-primary`、`--bg-secondary`、`--bg-hover`、`--text-primary`、`--text-secondary`、`--text-muted`、`--accent`、`--accent-hover`、`--border`、`--shadow`
- `useTheme` hook：
  1. 读取 `chrome.storage.local` 中的 `themeMode: 'system' | 'dark' | 'light'`
  2. 若为 `system`，监听 `window.matchMedia('prefers-color-scheme: dark')`
  3. 切换按钮：system → dark → light → system 循环
- 三个入口（popup/sidepanel/fullpage）各自挂载 `useTheme`，状态通过 `chrome.storage` 实时同步

---

## 7. 补充规则与边界条件

### 7.1 持久化分工原则

| 数据类型 | 存储位置 |
|---------|---------|
| 笔记内容、空间、标签、图片 Blob | IndexedDB（`awesome-note` db） |
| 主题偏好（`themeMode`）、空间展开状态、上次打开的笔记/空间 ID | `chrome.storage.local` |
| （未来）同步账号 token | `chrome.storage.local`（加密） |

规则：**内容数据 → IndexedDB；UI 状态与用户偏好 → chrome.storage.local**。

### 7.2 "全部笔记"根级视图

左栏空间树顶部有一个固定的虚拟入口 **"全部笔记"**（不可删除，不可重命名）。选中时，中栏显示所有笔记（`spaceId` 为任意值），按 `updatedAt` 降序。`spaceId: null` 的笔记视为"未归类"，在空间树中显示在所有空间下方的 **"未归类"** 虚拟节点中（同样不可删除）。

删除空间时：直属笔记（`spaceId === 被删空间.id`）的 `spaceId` 设为被删空间的 `parentId`（若为根级空间则设为 `null`）；子空间递归同步 `parentId`。

### 7.3 孤儿图片清理策略

**场景一：删除笔记** → 同步删除该笔记在 `images` store 中所有关联记录（`noteId === 被删笔记.id`）。

**场景二：编辑器内删除图片节点** → Tiptap 的 `AwesomeImage` 扩展在节点被删除时触发 `onDestroy` 回调，将图片 ID 加入"待删队列"（`chrome.storage.local` 中的 `pendingDeleteImages: string[]`）。每次启动时（各入口 `main.tsx`）扫描该队列，从 IndexedDB `images` store 删除对应记录后清空队列。

**场景三：创建副本** → 图片 Blob 重新写入 IndexedDB 生成新 ID，副本笔记持有新的图片 ID，与原笔记完全独立。

### 7.4 AwesomeImage 异步加载行为

图片节点渲染时调用 `getImageBlob(id)` 异步读取 IndexedDB：

- **加载中**：显示骨架占位（灰色圆角矩形，尺寸与图片等同）+ 旋转加载图标
- **加载成功**：`createObjectURL(blob)` 赋值给 `<img src>`；组件卸载时调用 `revokeObjectURL()`
- **加载失败（Blob 不存在或损坏）**：显示错误占位（图片图标 + "图片加载失败"文字），不抛出异常

### 7.5 空间移动循环检测

**"移动到"操作**的目标选择器必须过滤掉非法目标：
- 被移动空间自身
- 被移动空间的所有后代空间（递归）

过滤算法：在展示目标列表前，先递归收集被移动空间的所有后代 ID 集合，渲染时跳过集合内的空间。这样在 UI 层完全避免循环引用，无需运行时检测。

### 7.6 多窗口数据同步

**BroadcastChannel 消息协议**（channel name: `awesome-note-sync`）：

```typescript
type SyncMessage =
  | { type: 'NOTE_UPDATED'; id: string }
  | { type: 'NOTE_DELETED'; id: string }
  | { type: 'NOTE_CREATED'; id: string }
  | { type: 'SPACE_CHANGED' }   // 空间增删改，接收方全量重新获取
  | { type: 'TAG_CHANGED' }     // 标签增删改，接收方全量重新获取
```

接收方策略：`NOTE_UPDATED/CREATED/DELETED` 仅刷新受影响的列表项；`SPACE_CHANGED/TAG_CHANGED` 触发全量重新渲染对应面板。主题变更通过 `chrome.storage.onChanged` 事件广播，不走 BroadcastChannel。

### 7.7 状态恢复

| 模式 | 上次状态恢复方式 |
|------|---------------|
| 完整页面 | URL hash `#note/{id}` 优先；否则读 `chrome.storage.local` 中的 `lastOpenNoteId` |
| 侧边面板 | 读 `chrome.storage.local` 中的 `lastOpenNoteId`（panel 关闭即销毁） |
| 弹窗 | 读 `chrome.storage.local` 中的 `lastOpenNoteId`（popup 关闭即销毁） |

### 7.8 其他细节

**搜索范围**：跨所有空间全局搜索，搜索结果不区分空间（搜索激活时空间选中状态临时失效，退出搜索后恢复）。

**标签颜色**：预设 10 色调色板（蓝/绿/橙/红/紫/青/粉/黄/灰/深色），创建标签时弹窗展示色点供选择，默认蓝色。颜色值以 hex 存储在 `Tag.color` 字段。

**图片限制**：v1 不限制单张图片大小和每篇笔记图片数量，由浏览器 IndexedDB 配额（通常 ≥ 1GB）自然兜底。

**主题写入竞争**：`useTheme` 仅在用户手动切换时写入 `chrome.storage.local`。跟随系统模式下，OS 主题变化只更新各窗口本地的 React state，不写 storage，不存在竞争问题。

**弹窗左栏 overlay**：弹窗模式下左栏展开为覆盖中栏的浮层（width: 220px，`position: absolute`，`z-index: 100`），点击浮层外区域或按 Escape 关闭。

---

## 8. 数据流

```
用户操作
  ↓
React 组件事件
  ↓
Zustand store action（乐观更新 UI）
  ↓
lib/db.ts（IndexedDB 异步写入）+ BroadcastChannel 广播 SyncMessage（见 §7.6）
  ↓
hook 重新查询 → 组件重渲染
```

其他已打开的窗口（弹窗 / 侧面板 / 完整页面）监听 BroadcastChannel，收到消息后按 §7.6 策略刷新对应数据。主题和 UI 状态变更走 `chrome.storage.onChanged`。

---

## 9. 成功标准

- [ ] 三种模式可互相跳转，数据实时共享
- [ ] 新建笔记后 1s 内自动保存，关闭插件重开数据不丢失
- [ ] 图片粘贴/上传后在编辑器内正确显示
- [ ] 空间重名时显示提示并提供建议名称
- [ ] 列表/瀑布流视图可无缝切换
- [ ] 深色/亮色主题切换视觉一致
- [ ] 弹窗加载时间 < 300ms
