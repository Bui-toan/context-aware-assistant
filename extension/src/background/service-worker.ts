// =============================================================================
// Service Worker — background script của Extension.
// Phase 3: nhận request từ Content Script, log ra console (chưa gọi Backend).
// =============================================================================

import { onMessage } from "../shared/messaging/message-bus";

console.log("[Service Worker] Loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Service Worker] Extension installed/updated");

  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err: unknown) =>
      console.error("[Service Worker] setPanelBehavior error:", err)
    );
});

// ---- Phase 3: chỉ log. Phase 5-6 sẽ gọi backend ở đây. ----
onMessage("REQUEST_EXPLAIN", (payload) => {
  console.log("[Service Worker] REQUEST_EXPLAIN →", payload);
  return { ok: true };
});

onMessage("REQUEST_GRAMMAR", (payload) => {
  console.log("[Service Worker] REQUEST_GRAMMAR →", payload);
  return { ok: true };
});

onMessage("REQUEST_REWRITE", (payload) => {
  console.log("[Service Worker] REQUEST_REWRITE →", payload);
  return { ok: true };
});