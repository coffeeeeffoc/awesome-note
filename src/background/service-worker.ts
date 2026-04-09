// Background service worker
// Handles side panel opening on action click

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: false })
  .catch(() => {/* ignore if API unavailable */})

// Right-click context menu to open side panel
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-sidepanel',
    title: '在侧边面板中打开随心记',
    contexts: ['all'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-sidepanel' && tab?.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId })
  }
})
