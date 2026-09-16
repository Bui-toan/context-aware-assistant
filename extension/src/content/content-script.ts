// =============================================================================
// Content Script — entry point chạy trên mọi trang web.
// Phase 3: selection detection + floating action.
// =============================================================================

import { startSelectionDetection, onSelectionChange } from "./selection-detector";
import { show, hide, onAction, type FloatingActionType } from "./floating-action";
import { sendMessage } from "../shared/messaging/message-bus";

console.log("[Content Script] Loaded on:", window.location.href);

// ---- Lắng nghe selection thay đổi → hiện/ẩn toolbar ----
onSelectionChange((info) => {
  if (info && info.rect) {
    show(info);
  } else {
    hide();
  }
});

// ---- Khi user bấm 1 trong 3 nút → gửi message tới Service Worker ----
onAction((action: FloatingActionType, info) => {
  console.log("[Content Script] Action:", action, "| text:", info.text);

  const basePayload = {
    text: info.text,
    context: "",       // Phase 4 mới build context thật
    language: "vi" as const,
  };

  switch (action) {
    case "explain":
      void sendMessage("REQUEST_EXPLAIN", basePayload);
      break;
    case "grammar":
      void sendMessage("REQUEST_GRAMMAR", basePayload);
      break;
    case "rewrite":
      void sendMessage("REQUEST_REWRITE", { ...basePayload, mode: "formal" });
      break;
  }
});

// ---- Khởi động ----
startSelectionDetection();

export {};