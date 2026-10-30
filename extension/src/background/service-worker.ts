import { onMessage, sendMessage } from "../shared/messaging/message-bus";
import { postExplain, postSearch, postGrammar, postRewrite } from "../shared/api/client";
import type { ExplainRequestPayload, GrammarRequestPayload, RewriteRequestPayload } from "../shared/messaging/types";

console.log("[Service Worker] Loaded");

// ==========================================
// 1. TẠO MENU CHUỘT PHẢI (CONTEXT MENU)
// ==========================================
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

  const menuItems = [
    { id: "caa-explain", title: "AI: Explain (Giải thích)" },
    { id: "caa-search", title: "AI: Search (Tìm kiếm)" },
    { id: "caa-grammar", title: "AI: Grammar (Ngữ pháp)" },
    { id: "caa-rewrite", title: "AI: Rewrite (Viết lại)" },
  ];

  menuItems.forEach(item => {
    chrome.contextMenus.create({
      id: item.id,
      title: item.title,
      contexts: ["selection"] // Chỉ hiện khi có bôi đen chữ
    });
  });
});

// ==========================================
// 2. XỬ LÝ KHI BẤM VÀO MENU CHUỘT PHẢI
// ==========================================
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText || !tab?.id) return;
  
  const text = info.selectionText;

  // Mở Side Panel tự động
  if (tab.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }

  // Lấy ngôn ngữ hiện tại từ Storage
  const lang = await new Promise<"vi" | "en">((resolve) => {
    chrome.storage.local.get(["language"], (res) => resolve(res.language || "vi"));
  });

  const context = ""; // Không có context khi dùng menu chuột phải
  const defaultMode = "formal";

  // Gửi tín hiệu cho Side Panel (App.tsx) để điền chữ và chuyển Tab
  if (info.menuItemId === "caa-explain") {
    await sendMessage("REQUEST_EXPLAIN", { text, context, language: lang });
    handleAiRequest("explain", postExplain({ text, context, language: lang }));
  } 
  else if (info.menuItemId === "caa-grammar") {
    await sendMessage("REQUEST_GRAMMAR", { text, context, language: lang });
    handleAiRequest("grammar", postGrammar({ text, context, language: lang }));
  } 
  else if (info.menuItemId === "caa-rewrite") {
    await sendMessage("REQUEST_REWRITE", { text, context, mode: defaultMode, language: lang });
    handleAiRequest("rewrite", postRewrite({ text, context, mode: defaultMode, language: lang }));
  }
  else if (info.menuItemId === "caa-search") {
    // Đối với Search, UI sẽ tự động gọi API thông qua tab Search
    await sendMessage("REQUEST_SEARCH", { query: text, topK: 5 });
  }
});

// ==========================================
// 3. CÁC HÀM XỬ LÝ API (TỪ SIDE PANEL GỬI XUỐNG)
// ==========================================
async function handleAiRequest(actionType: string, apiCall: Promise<any>) {
  try {
    const result = await apiCall;
    await sendMessage("RESULT_READY", { actionType, data: result });
    return { ok: true };
  } catch (err: any) {
    console.error(`[Service Worker] Lỗi ${actionType}:`, err);
    await sendMessage("ERROR", {
      actionType,
      code: "AI_PROVIDER_ERROR",
      message: err.message || "Lỗi gọi API Backend",
    });
    return { ok: false };
  }
}

onMessage("REQUEST_EXPLAIN", async (payload) => {
  return await handleAiRequest("explain", postExplain(payload as ExplainRequestPayload));
});

onMessage("REQUEST_GRAMMAR", async (payload) => {
  console.log("[Service Worker] REQUEST_GRAMMAR →", payload);
  return await handleAiRequest("grammar", postGrammar(payload as GrammarRequestPayload));
});

onMessage("REQUEST_REWRITE", async (payload) => {
  console.log("[Service Worker] REQUEST_REWRITE →", payload);
  return await handleAiRequest("rewrite", postRewrite(payload as RewriteRequestPayload));
});

onMessage("REQUEST_SEARCH", async (payload) => {
  const req = payload as any;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) throw new Error("Không tìm thấy tab");

    // Nếu là file PDF, Content Script không chạy được nên sẽ báo lỗi ở đây
        const pageChunks = await chrome.tabs.sendMessage(tabs[0].id, {
      type: "GET_PAGE_CHUNKS", requestId: crypto.randomUUID(), payload: {}
    }).catch((e) => {
        console.error("[Service Worker] Lỗi gửi message lấy chunks:", e);
        throw new Error("ERR_NO_CONNECTION"); // Thay bằng mã lỗi
    }) as { chunks: any[] };

    console.log(`[Service Worker] Nhận được ${pageChunks.chunks?.length || 0} chunks từ trang.`);

    if (!pageChunks.chunks || pageChunks.chunks.length === 0) {
      throw new Error("ERR_NO_CHUNKS"); // Thay bằng mã lỗi
    }

    const result = await postSearch({ query: req.query, chunks: pageChunks.chunks, topK: req.topK || 5 });
    await sendMessage("RESULT_READY", {
      actionType: "search",
      data: { results: result.results, originalChunks: pageChunks.chunks }
    });
    return { ok: true };
  } catch (err: any) {
    await sendMessage("ERROR", { actionType: "search", code: "SEARCH_ERROR", message: err.message });
    return { ok: false };
  }
});

// ==========================================
// 4. CÁC LỆNH ĐIỀU HƯỚNG KHÁC
// ==========================================
onMessage("HIGHLIGHT_CHUNK", async (payload: any) => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: "HIGHLIGHT_CHUNK", requestId: crypto.randomUUID(), payload
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false };
  }
});

onMessage("APPLY_SUGGESTION", async (payload: any) => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: "APPLY_SUGGESTION", requestId: crypto.randomUUID(), payload
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false };
  }
});