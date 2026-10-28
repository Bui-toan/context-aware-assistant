import { startSelectionDetection, onSelectionChange, lastSavedElement, clearSavedElement, type SelectionInfo } from "./selection-detector";
import { show, hide, onAction, type FloatingActionType } from "./floating-action";
import { sendMessage } from "../shared/messaging/message-bus";
import { extractContext } from "./context-extraction";
import { extractPageText } from "./search/page-text-extractor";
import { clearChunkMap } from "./search/chunk-mapper";
import { highlightChunk } from "./search/highlighter";

console.log("[Content Script] Loaded on:", window.location.href);

let currentLang: "vi" | "en" = "vi";
chrome.storage.local.get(["language"], (res) => { if (res.language) currentLang = res.language; });
chrome.storage.onChanged.addListener((changes) => { if (changes.language) currentLang = changes.language.newValue; });

// Đã thêm type SelectionInfo | null cho info
onSelectionChange((info: SelectionInfo | null) => {
  if (info && info.rect) show(info, currentLang); 
  else hide();
});

onAction(async (action: FloatingActionType, info) => {
  if (action === "search") {
    void sendMessage("REQUEST_SEARCH", { query: info.text, topK: 5 });
    chrome.runtime.sendMessage({ type: "SWITCH_TAB", payload: { tab: "search" } });
    return;
  }

  const settings = await new Promise<any>((resolve) => {
    chrome.storage.local.get(["language", "maxContext"], (res) => resolve(res));
  });
  
  const lang = settings.language || "vi";
  const maxLimit = settings.maxContext || 500;

  const context = extractContext(info.node, info.text);
  
  if (info.text.length > maxLimit || context.length > maxLimit) {
    chrome.runtime.sendMessage({ 
      type: "ERROR", 
      payload: { 
        actionType: action,
        message: `Văn bản vượt quá giới hạn ${maxLimit} ký tự! (Hiện tại: ${Math.max(info.text.length, context.length)} ký tự). Vui lòng bôi đen đoạn ngắn hơn.` 
      } 
    });
    chrome.runtime.sendMessage({ type: "SWITCH_TAB", payload: { tab: action } });
    return;
  }

  const basePayload = { text: info.text, context: context, language: lang };

  if (action === "explain") void sendMessage("REQUEST_EXPLAIN", basePayload);
  else if (action === "grammar") void sendMessage("REQUEST_GRAMMAR", basePayload);
  else if (action === "rewrite") void sendMessage("REQUEST_REWRITE", { ...basePayload, mode: "formal" });
});

startSelectionDetection();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_PAGE_CHUNKS") {
    clearChunkMap();
    sendResponse({ chunks: extractPageText() });
  }
  
  if (message.type === "HIGHLIGHT_CHUNK") {
    highlightChunk(message.payload.chunkId, message.payload.text);
    sendResponse({ ok: true });
  }
  
  if (message.type === "APPLY_SUGGESTION") {
    const { suggested } = message.payload;
    let applied = false;
    
    try {
      if (lastSavedElement) {
        const tag = lastSavedElement.tagName.toLowerCase();
        
        if (tag === "input" || tag === "textarea") {
          const el = lastSavedElement as HTMLInputElement | HTMLTextAreaElement;
          el.focus();
          el.setRangeText(suggested, el.selectionStart ?? 0, el.selectionEnd ?? 0, "end");
          applied = true;
        } 
        else if (lastSavedElement.isContentEditable || lastSavedElement.closest("[contenteditable]")) {
          lastSavedElement.focus();
          applied = document.execCommand("insertText", false, suggested);
        }
      }
    } catch (e) {
      console.error("Lỗi Apply:", e);
    }

    if (!applied) {
      navigator.clipboard.writeText(suggested);
      alert("Đã sao chép nội dung! (Lưu ý: Không thể tự động ghi đè văn bản trên trang web để tránh phá vỡ giao diện).");
    }
    
    // Sử dụng hàm clear thay vì gán trực tiếp
    clearSavedElement();
    sendResponse({ ok: true });
  }

  return true;
});
export {};