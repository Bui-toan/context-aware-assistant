import { startSelectionDetection, onSelectionChange } from "./selection-detector";
import { show, hide, onAction, type FloatingActionType } from "./floating-action";
import { sendMessage } from "../shared/messaging/message-bus";
import { extractContext } from "./context-extraction";
import { extractPageText } from "./search/page-text-extractor";
import { clearChunkMap } from "./search/chunk-mapper";
import { highlightChunk } from "./search/highlighter";

console.log("[Content Script] Loaded on:", window.location.href);

onSelectionChange((info) => {
  if (info && info.rect) show(info); else hide();
});

// Xử lý khi bấm nút trên Floating Action
onAction(async (action: FloatingActionType, info) => {
  console.log("[Content Script] Action:", action, "| text:", info.text);

  // Nếu là Search, gửi request và yêu cầu đổi tab
  if (action === "search") {
    void sendMessage("REQUEST_SEARCH", { query: info.text, topK: 5 });
    chrome.runtime.sendMessage({ type: "SWITCH_TAB", payload: { tab: "search" } });
    return;
  }

  // Các action khác cần lấy context
  const settings = await new Promise<any>((resolve) => {
    chrome.storage.local.get(["language", "defaultRewriteMode"], (res) => resolve(res));
  });
  const lang = settings.language || "vi";
  const rewriteMode = settings.defaultRewriteMode || "formal";
  const context = extractContext(info.node, info.text);
  
  const basePayload = { text: info.text, context: context, language: lang };

  if (action === "explain") void sendMessage("REQUEST_EXPLAIN", basePayload);
  else if (action === "grammar") void sendMessage("REQUEST_GRAMMAR", basePayload);
  else if (action === "rewrite") void sendMessage("REQUEST_REWRITE", { ...basePayload, mode: rewriteMode });
});

startSelectionDetection();

// Lắng nghe lệnh từ Service Worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // 1. Quét trang cho Search
  if (message.type === "GET_PAGE_CHUNKS") {
    clearChunkMap();
    sendResponse({ chunks: extractPageText() });
  }
  
  // 2. Highlight kết quả
  if (message.type === "HIGHLIGHT_CHUNK") {
    highlightChunk(message.payload.chunkId);
    sendResponse({ ok: true });
  }
  
  // 3. Áp dụng văn bản mới (Apply)
  if (message.type === "APPLY_SUGGESTION") {
    const { suggested } = message.payload;
    
    // Ưu tiên 1: input/textarea đang focus
    const active = document.activeElement as HTMLElement;
    if (active && (active.tagName.toLowerCase() === "input" || active.tagName.toLowerCase() === "textarea")) {
      const el = active as HTMLInputElement | HTMLTextAreaElement;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      el.setRangeText(suggested, start, end, "end");
    } 
    // Ưu tiên 2: contenteditable
    else if (active && active.isContentEditable) {
      document.execCommand("insertText", false, suggested);
    } 
    // Fallback: Copy vào clipboard
    else {
      navigator.clipboard.writeText(suggested);
      alert("Không thể tự động ghi đè trang này. Đã COPY nội dung vào Clipboard!");
    }
    sendResponse({ ok: true });
  }

  return true;
});

export {};