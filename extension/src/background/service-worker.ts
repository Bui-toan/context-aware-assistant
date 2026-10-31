import { onMessage, sendMessage } from "../shared/messaging/message-bus";
import { postExplain, postSearch, postGrammar, postRewrite } from "../shared/api/client";
import type {
  ExplainRequestPayload,
  GrammarRequestPayload,
  RewriteRequestPayload,
  SearchRequestPayload,
  MessageType,
} from "../shared/messaging/types";

console.log("[Service Worker] Loaded");

type Chunk = { chunkId: string; text: string };

// Gửi tin nhắn tới Side Panel. Không báo lỗi nếu panel chưa mở (tránh làm hỏng request chính).
function emit(type: MessageType, payload: unknown): Promise<unknown> {
  return sendMessage(type, payload).catch(() => undefined);
}

// Báo Side Panel chuyển tab (SWITCH_TAB không nằm trong MessageType nên gửi trực tiếp).
// Chờ một chút để Side Panel vừa mở kịp đăng ký listener.
async function switchTab(tab: string, query?: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
  chrome.runtime.sendMessage({ type: "SWITCH_TAB", payload: { tab, query } }).catch(() => {});
}

async function getLanguage(): Promise<"vi" | "en"> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["language"], (res) => resolve(res.language || "vi"));
  });
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

// ==========================================
// 1. MENU CHUỘT PHẢI
// ==========================================
const MENU_ITEMS = [
  { id: "caa-explain", title: "AI: Explain (Giải thích)" },
  { id: "caa-search", title: "AI: Search (Tìm kiếm)" },
  { id: "caa-grammar", title: "AI: Grammar (Ngữ pháp)" },
  { id: "caa-rewrite", title: "AI: Rewrite (Viết lại)" },
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

  chrome.contextMenus.removeAll(() => {
    for (const item of MENU_ITEMS) {
      chrome.contextMenus.create({
        id: item.id,
        title: item.title,
        contexts: ["selection"], // Chỉ hiện khi có bôi đen chữ
      });
    }
  });
});

// ==========================================
// 2. XỬ LÝ KHI BẤM MENU CHUỘT PHẢI
// ==========================================
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const text = info.selectionText?.trim();
  if (!text || !tab?.id) return;

  // sidePanel.open() phải được gọi ngay (còn trong thao tác của người dùng), trước mọi await khác
  if (tab.windowId !== undefined) chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});

  const language = await getLanguage();
  const context = ""; // Menu chuột phải không có ngữ cảnh

  switch (info.menuItemId) {
    case "caa-explain": {
      const p = { text, context, language };
      void emit("REQUEST_EXPLAIN", p); // báo Side Panel hiện "đang xử lý"
      void switchTab("explain");
      void handleAiRequest("explain", postExplain(p));
      break;
    }
    case "caa-grammar": {
      const p = { text, context, language };
      void emit("REQUEST_GRAMMAR", p);
      void switchTab("grammar");
      void handleAiRequest("grammar", postGrammar(p));
      break;
    }
    case "caa-rewrite": {
      const p = { text, context, mode: "formal" as const, language };
      void emit("REQUEST_REWRITE", p);
      void switchTab("rewrite");
      void handleAiRequest("rewrite", postRewrite(p));
      break;
    }
    case "caa-search":
      // Side Panel (SearchView) sẽ tự gọi tìm kiếm khi nhận từ khóa
      void switchTab("search", text);
      break;
  }
});

// ==========================================
// 3. GỌI API (từ Side Panel / Content Script gửi xuống)
// ==========================================
async function handleAiRequest(actionType: string, apiCall: Promise<unknown>) {
  try {
    const result = await apiCall;
    await emit("RESULT_READY", { actionType, data: result });
    return { ok: true };
  } catch (err: any) {
    console.error(`[Service Worker] Lỗi ${actionType}:`, err);
    await emit("ERROR", {
      actionType,
      code: "AI_PROVIDER_ERROR",
      message: err?.message || "Lỗi gọi API Backend",
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
  const req = payload as SearchRequestPayload;
  try {
    // PDF và Google Docs: Side Panel đã tự lấy văn bản và gửi kèm trong payload.chunks
    let chunks: Chunk[] | undefined = req.chunks;

    // Trang web thường: hỏi Content Script lấy các đoạn văn bản
    if (!chunks?.length) {
      const tab = await getActiveTab();
      if (!tab?.id) throw new Error("Không tìm thấy tab");
      const res = (await chrome.tabs
        .sendMessage(tab.id, { type: "GET_PAGE_CHUNKS", requestId: crypto.randomUUID(), payload: {} })
        .catch((e) => {
          console.error("[Service Worker] Lỗi gửi message lấy chunks:", e);
          throw new Error("ERR_NO_CONNECTION");
        })) as { chunks?: Chunk[] };
      chunks = res?.chunks;
    }

    console.log(`[Service Worker] Nhận được ${chunks?.length || 0} chunks.`);
    if (!chunks || chunks.length === 0) throw new Error("ERR_NO_CHUNKS");

    const result = await postSearch({ query: req.query, chunks, topK: req.topK || 5 });
    await emit("RESULT_READY", {
      actionType: "search",
      data: { results: result.results, originalChunks: chunks },
    });
    return { ok: true };
  } catch (err: any) {
    await emit("ERROR", { actionType: "search", code: "SEARCH_ERROR", message: err?.message });
    return { ok: false };
  }
});

// ==========================================
// 4. CÁC LỆNH ĐIỀU HƯỚNG KHÁC
// ==========================================
onMessage("HIGHLIGHT_CHUNK", async (payload) => {
  const tab = await getActiveTab();
  if (!tab?.id) return { ok: false };

  const id = String((payload as { chunkId?: string })?.chunkId ?? "");

  // PDF: không highlight được trong trình xem, chỉ nhảy tới đúng trang
  const pdf = /^pdf-p(\d+)-/.exec(id);
  if (pdf && tab.url) {
    await chrome.tabs.update(tab.id, { url: `${tab.url.split("#")[0]}#page=${pdf[1]}` }).catch(() => {});
    return { ok: true };
  }
  // Google Docs: chỉ hiển thị đoạn trích trong Side Panel
  if (id.startsWith("doc-")) return { ok: true };

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "HIGHLIGHT_CHUNK", requestId: crypto.randomUUID(), payload });
    return { ok: true };
  } catch {
    return { ok: false };
  }
});

onMessage("APPLY_SUGGESTION", async (payload) => {
  try {
    const tab = await getActiveTab();
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, { type: "APPLY_SUGGESTION", requestId: crypto.randomUUID(), payload });
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
});