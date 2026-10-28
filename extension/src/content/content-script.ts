import { startSelectionDetection, onSelectionChange, lastSavedRange, lastSavedElement } from "./selection-detector";
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

onSelectionChange((info) => {
  if (info && info.rect) show(info, currentLang); 
  else hide();
});

onAction(async (action: FloatingActionType, info) => {
  if (action === "search") {
    void sendMessage("REQUEST_SEARCH", { query: info.text, topK: 5 });
    chrome.runtime.sendMessage({ type: "SWITCH_TAB", payload: { tab: "search" } });
    return;
  }

  // Lấy setting từ storage
  const settings = await new Promise<any>((resolve) => {
    chrome.storage.local.get(["language", "maxContext"], (res) => resolve(res));
  });
  
  const lang = settings.language || "vi";
  const maxLimit = settings.maxContext || 500; // Mặc định 500 nếu chưa set

  // Tạo context và kiểm tra giới hạn
  const context = extractContext(info.node, info.text);
  
  // Nếu context (hoặc text) dài hơn giới hạn -> Chặn và báo lỗi
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
      // Ưu tiên 1: Nếu đang bôi đen trong ô input/textarea thông thường
      if (lastSavedElement && (lastSavedElement.tagName.toLowerCase() === "input" || lastSavedElement.tagName.toLowerCase() === "textarea")) {
        const el = lastSavedElement as HTMLInputElement | HTMLTextAreaElement;
        el.focus(); // Bắt buộc phải focus lại
        el.setRangeText(suggested, el.selectionStart ?? 0, el.selectionEnd ?? 0, "end");
        applied = true;
      } 
      // Ưu tiên 2: Nếu đang bôi đen chữ thường (như trên Google Dịch)
      else if (lastSavedRange) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(lastSavedRange); // Phục hồi lại vùng bôi đen
        }
        
        // Cách 1: Dùng execCommand (hoạt động tốt với Google Dịch)
        applied = document.execCommand("insertText", false, suggested);
        
        // Cách 2: Nếu execCommand thất bại, chèn thủ công bằng DOM
        if (!applied) {
          lastSavedRange.deleteContents();
          const textNode = document.createTextNode(suggested);
          lastSavedRange.insertNode(textNode);
          // Đặt con trỏ sau đoạn vừa chèn
          lastSavedRange.setStartAfter(textNode);
          lastSavedRange.setEndAfter(textNode);
          applied = true;
        }
      }
    } catch (e) {
      console.error("Lỗi Apply:", e);
    }

    // Nếu tất cả cách đều thất bại -> Copy vào Clipboard
    if (!applied) {
      navigator.clipboard.writeText(suggested);
      alert("Trình duyệt chặn ghi đè trang này. Đã tự động COPY nội dung vào Clipboard!");
    }
    
    sendResponse({ ok: true });
  }

  return true;
});
export {};