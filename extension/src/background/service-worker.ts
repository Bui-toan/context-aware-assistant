import { onMessage, sendMessage } from "../shared/messaging/message-bus";
import { postExplain } from "../shared/api/client";
import type { ExplainRequestPayload } from "../shared/messaging/types";

console.log("[Service Worker] Loaded");

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});

// ---- Xử lý REQUEST_EXPLAIN ----
onMessage("REQUEST_EXPLAIN", async (payload) => {
  const req = payload as ExplainRequestPayload;
  console.log("[Service Worker] REQUEST_EXPLAIN →", req);

  // 1. Thử mở Side Panel (Bọc trong try/catch riêng để không block API)
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.windowId) {
      await chrome.sidePanel.open({ windowId: tabs[0].windowId });
    }
  } catch (e) {
    console.warn("[Service Worker] Không thể tự mở Side Panel do Chrome chặn (cần user gesture). Hãy mở thủ công.");
  }

  // 2. Gọi Backend
  try {
    const result = await postExplain(req);
    await sendMessage("RESULT_READY", {
      actionType: "explain",
      data: result,
    });
    return { ok: true };
  } catch (err: any) {
    console.error("[Service Worker] Explain error:", err);
    await sendMessage("ERROR", {
      code: "AI_PROVIDER_ERROR",
      message: err.message || "Không thể kết nối Backend",
    });
    return { ok: false };
  }
});