import { startSelectionDetection, onSelectionChange } from "./selection-detector";
import { show, hide, onAction, type FloatingActionType } from "./floating-action";
import { sendMessage } from "../shared/messaging/message-bus";
import { extractContext } from "./context-extraction";
import { extractPageText } from "./search/page-text-extractor";
import { clearChunkMap } from "./search/chunk-mapper";

console.log("[Content Script] Loaded on:", window.location.href);

onSelectionChange((info) => {
  if (info && info.rect) {
    show(info);
  } else {
    hide();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_PAGE_CHUNKS") {
    clearChunkMap(); // Xóa map cũ trước khi quét mới
    const chunks = extractPageText();
    sendResponse({ chunks });
  }
  return true;
});

onAction((action: FloatingActionType, info) => {
  console.log("[Content Script] Action:", action, "| text:", info.text);

  // Trích xuất ngữ cảnh xung quanh
  const context = extractContext(info.node, info.text);
  console.log("[Content Script] Extracted Context:", context);

  const basePayload = {
    text: info.text,
    context: context, // Đã có context thật
    language: "vi" as const,
  };

  if (action === "explain") {
    void sendMessage("REQUEST_EXPLAIN", basePayload);
  }
  // Grammar / Rewrite sẽ làm sau
});

startSelectionDetection();
export {};