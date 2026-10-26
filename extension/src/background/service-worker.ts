import { onMessage, sendMessage } from "../shared/messaging/message-bus";
import { postExplain, postGrammar, postRewrite } from "../shared/api/client";
import type { ExplainRequestPayload, GrammarRequestPayload, RewriteRequestPayload } from "../shared/messaging/types";
import type { SearchRequestPayload } from "../shared/messaging/types";

console.log("[Service Worker] Loaded");

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});

async function handleAiRequest(actionType: string, apiCall: Promise<any>) {
  try {
    const result = await apiCall;
    await sendMessage("RESULT_READY", { actionType, data: result });
    return { ok: true };
  } catch (err: any) {
    await sendMessage("ERROR", {
      code: "AI_PROVIDER_ERROR",
      message: err.message || "Lỗi gọi API",
    });
    return { ok: false };
  }
}

onMessage("REQUEST_SEARCH", async (payload) => {
  const req = payload as SearchRequestPayload;
  console.log("[Service Worker] REQUEST_SEARCH →", req.query);

  try {
    // 1. Lấy tab hiện tại
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) throw new Error("Không tìm thấy tab hiện tại");

    // 2. Yêu cầu Content Script quét toàn bộ trang
    const pageChunks = await chrome.tabs.sendMessage(tabs[0].id, {
      type: "GET_PAGE_CHUNKS",
      requestId: crypto.randomUUID(),
      payload: {}
    }) as { chunks: any[] };

    console.log(`[Service Worker] Lấy được ${pageChunks.chunks.length} chunks từ trang`);

    if (pageChunks.chunks.length === 0) {
      throw new Error("Trang này không có đoạn văn bản nào phù hợp để tìm kiếm.");
    }

    // 3. Gửi lên Backend
    const res = await fetch("http://localhost:8000/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: req.query,
        chunks: pageChunks.chunks,
        topK: req.topK || 5
      })
    });

    if (!res.ok) throw new Error("Lỗi gọi API Search từ Backend");
    const result = await res.json();

    // 4. Trả kết quả về Side Panel
    await sendMessage("RESULT_READY", {
      actionType: "search",
      data: { results: result.results, originalChunks: pageChunks.chunks }
    });

    return { ok: true };
  } catch (err: any) {
    console.error("[Service Worker] Search error:", err);
    await sendMessage("ERROR", { code: "SEARCH_ERROR", message: err.message });
    return { ok: false };
  }
});

// ---- Xử lý REQUEST_EXPLAIN ----
onMessage("REQUEST_EXPLAIN", async (payload) => {
  const req = payload as ExplainRequestPayload;
  console.log("[Service Worker] REQUEST_EXPLAIN →", req);

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

onMessage("HIGHLIGHT_CHUNK", async (payload) => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.id) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "HIGHLIGHT_CHUNK",
      requestId: crypto.randomUUID(),
      payload
    });
  }
  return { ok: true };
});

onMessage("REQUEST_GRAMMAR", async (payload) => {
  const req = payload as GrammarRequestPayload;
  console.log("[Service Worker] REQUEST_GRAMMAR →", req);
  // KHÔNG GỌI chrome.sidePanel.open() Ở ĐÂY NỮA
  return await handleAiRequest("grammar", postGrammar(req));
});

// --- REWRITE ---
onMessage("REQUEST_REWRITE", async (payload) => {
  const req = payload as RewriteRequestPayload;
  console.log("[Service Worker] REQUEST_REWRITE →", req);
  // KHÔNG GỌI chrome.sidePanel.open() Ở ĐÂY NỮA
  return await handleAiRequest("rewrite", postRewrite(req));
});