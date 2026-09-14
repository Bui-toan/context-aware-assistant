// Phase 3 sẽ viết logic thật ở đây. Phase 2 chỉ cần file tồn tại để manifest load được.

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Service Worker] Extension installed/updated");

  // Bật side panel mở khi bấm icon extension
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error("[Service Worker] setPanelBehavior error:", err));
});

console.log("[Service Worker] Loaded");