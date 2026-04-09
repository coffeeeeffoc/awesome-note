// Background service worker

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

// Message handler: popup/fullpage asks background to open the side panel
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    // Get the window from the sender tab, or fall back to the last focused window
    const windowId = sender.tab?.windowId
    if (windowId) {
      chrome.sidePanel.open({ windowId })
    } else {
      chrome.windows.getLastFocused((win) => {
        if (win.id) chrome.sidePanel.open({ windowId: win.id })
      })
    }
  }
})
