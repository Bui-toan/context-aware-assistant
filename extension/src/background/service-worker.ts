import { onMessage, sendMessage } from "../shared/messaging/message-bus";
import { postExplain, postSearch, postGrammar, postRewrite } from "../shared/api/client";
import type { ExplainRequestPayload, GrammarRequestPayload, RewriteRequestPayload } from "../shared/messaging/types";

console.log("[Service Worker] Loaded");

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});

// Hàm hỗ trợ gọi API chung
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

    const pageChunks = await chrome.tabs.sendMessage(tabs[0].id, {
      type: "GET_PAGE_CHUNKS", requestId: crypto.randomUUID(), payload: {}
    }) as { chunks: any[] };

    if (!pageChunks.chunks || pageChunks.chunks.length === 0) {
      throw new Error("Trang này không có đoạn văn bản nào phù hợp để tìm kiếm.");
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

// --- PHẦN BỊ THIẾU ĐÃ ĐƯỢC THÊM LẠI: LẮNG NGHE YÊU CẦU HIGHLIGHT TỪ SIDE PANEL ---
onMessage("HIGHLIGHT_CHUNK", async (payload: any) => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      // Chuyển tiếp lệnh xuống Content Script trên trang web
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: "HIGHLIGHT_CHUNK",
        requestId: crypto.randomUUID(),
        payload
      });
    }
    return { ok: true };
  } catch (err) {
    console.warn("Lỗi khi gửi lệnh highlight xuống trang:", err);
    return { ok: false };
  }
});

// Thêm đoạn này vào cuối file service-worker.ts
onMessage("APPLY_SUGGESTION", async (payload: any) => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      // Chuyển tiếp lệnh xuống Content Script
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: "APPLY_SUGGESTION",
        requestId: crypto.randomUUID(),
        payload
      });
    }
    return { ok: true };
  } catch (err) {
    console.warn("Lỗi khi gửi lệnh apply xuống trang:", err);
    return { ok: false };
  }
});