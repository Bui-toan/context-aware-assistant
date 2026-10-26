import { startSelectionDetection, onSelectionChange } from "./selection-detector";
import { show, hide, onAction, type FloatingActionType } from "./floating-action";
import { sendMessage } from "../shared/messaging/message-bus";
import { extractContext } from "./context-extraction";
import { extractPageText } from "./search/page-text-extractor";
import { clearChunkMap } from "./search/chunk-mapper";
import { highlightChunk } from "./search/highlighter";

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
    clearChunkMap();
    const chunks = extractPageText();
    sendResponse({ chunks });
  }
  
  if (message.type === "HIGHLIGHT_CHUNK") {
    highlightChunk(message.payload.chunkId);
    sendResponse({ ok: true });
  } 

  if (message.type === "APPLY_SUGGESTION") {
  const { suggested } = message.payload;
  
  // 1. Nếu đang bôi đen trong input/textarea
  const active = document.activeElement as HTMLElement;
  if (active && (active.tagName.toLowerCase() === "input" || active.tagName.toLowerCase() === "textarea")) {
    const el = active as HTMLInputElement | HTMLTextAreaElement;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    el.setRangeText(suggested, start, end, "end");
  } 
  // 2. Nếu trong contenteditable (như Google Docs, Notion...)
  else if (active && active.isContentEditable) {
    // Dùng execCommand (tuy cũ nhưng hoạt động tốt với rich text)
    document.execCommand("insertText", false, suggested);
  } 
  // 3. Các trường hợp khác (Editor lạ) -> Fallback Copy
  else {
    navigator.clipboard.writeText(suggested);
    alert("Không thể tự động ghi đè trên trang này. Đã tự động COPY nội dung vào Clipboard!");
  }
  
  sendResponse({ ok: true });
}
  
return true;
});

let isProcessing = false;

onAction(async (action: FloatingActionType, info) => {

  if (isProcessing) {
    console.log("Đang xử lý, vui lòng chờ...");
    return;
  }
  isProcessing = true;

  // Lấy cài đặt từ storage
  const settings = await new Promise<any>((resolve) => {
    chrome.storage.local.get(["language", "defaultRewriteMode"], (res) => {
      resolve(res);
    });
  
  setTimeout(() => { isProcessing = false; }, 3000);
  });

  const lang = settings.language || "vi";
  const rewriteMode = settings.defaultRewriteMode || "formal";
  
  const context = extractContext(info.node, info.text);
  const basePayload = { text: info.text, context: context, language: lang };

  if (action === "explain") {
    void sendMessage("REQUEST_EXPLAIN", basePayload);
  } else if (action === "grammar") {
    void sendMessage("REQUEST_GRAMMAR", basePayload);
  } else if (action === "rewrite") {
    void sendMessage("REQUEST_REWRITE", { ...basePayload, mode: rewriteMode });
  }
});

startSelectionDetection();
export {};