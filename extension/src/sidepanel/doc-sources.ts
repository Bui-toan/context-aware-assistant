// =============================================================================
// doc-sources.ts — lấy văn bản để Search trên PDF và Google Docs (chạy trong Side Panel)
// Cần: npm install pdfjs-dist  |  manifest: host_permissions có "<all_urls>"
// =============================================================================
import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type Chunk = { chunkId: string; text: string };
export type SourceKind = "web" | "pdf" | "gdoc";
export interface ActiveSource {
  kind: SourceKind;
  tabId?: number;
  url: string;
}

const MAX_BLOCKS = 300; // khớp MAX_BLOCKS của backend/plan
const pdfCache = new Map<string, Chunk[]>();

// ---------------------------------------------------------------- nhận diện loại trang
async function isPdfTab(tabId: number, url: string): Promise<boolean> {
  try {
    const [r] = await chrome.scripting.executeScript({ target: { tabId }, func: () => document.contentType });
    if (r?.result === "application/pdf") return true;
    if (r?.result) return false; // trang HTML bình thường
  } catch {
    /* trang không cho chạy script: có thể là trình xem PDF, thử cách khác bên dưới */
  }
  try {
    const res = await fetch(url, { method: "HEAD" });
    return (res.headers.get("content-type") || "").includes("application/pdf");
  } catch {
    return false;
  }
}

export async function getActiveSource(): Promise<ActiveSource> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const url = tab?.url ?? "";
  if (/^https:\/\/docs\.google\.com\/document\/(u\/\d+\/)?d\//.test(url)) {
    return { kind: "gdoc", tabId: tab?.id, url };
  }
  if (/\.pdf($|[?#])/i.test(url)) return { kind: "pdf", tabId: tab?.id, url };
  if (tab?.id !== undefined && /^(https?|file):/.test(url) && (await isPdfTab(tab.id, url))) {
    return { kind: "pdf", tabId: tab.id, url };
  }
  return { kind: "web", tabId: tab?.id, url };
}

// ---------------------------------------------------------------- chia chữ thành chunk (tối đa MAX_BLOCKS)
type Unit = { key: string; text: string };

function buildChunks(units: Unit[], size: number): Chunk[] {
  const out: Chunk[] = [];
  for (const u of units) {
    const parts = u.text
      .split(/(?<=[.!?…])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    let cur = "";
    let n = 0;
    const flush = () => {
      if (cur.length >= 5) out.push({ chunkId: `${u.key}-${n++}`, text: cur });
      cur = "";
    };
    for (const s of parts) {
      if (cur && cur.length + s.length + 1 > size) flush();
      cur = cur ? `${cur} ${s}` : s;
    }
    flush();
  }
  return out;
}

function chunkUnits(units: Unit[], totalChars: number): Chunk[] {
  let size = Math.max(400, Math.ceil((totalChars / MAX_BLOCKS) * 1.15));
  let chunks = buildChunks(units, size);
  for (let i = 0; i < 6 && chunks.length > MAX_BLOCKS; i++) {
    size = Math.ceil(size * 1.4);
    chunks = buildChunks(units, size);
  }
  return chunks.slice(0, MAX_BLOCKS);
}

// ---------------------------------------------------------------- PDF (chunkId dạng pdf-p<trang>-<thứ tự>)
export async function extractPdfChunks(url: string): Promise<Chunk[]> {
  const cached = pdfCache.get(url);
  if (cached) return cached;

  const res = await fetch(url); // file:// cần bật "Allow access to file URLs" trong chrome://extensions
  if (!res.ok) throw new Error(`Không tải được PDF (HTTP ${res.status})`);
  const data = new Uint8Array(await res.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;

  const units: Unit[] = [];
  let total = 0;
  for (let p = 1; p <= pdf.numPages; p++) {
    const content = await (await pdf.getPage(p)).getTextContent();
    const text = content.items
      .map((it: any) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : ""))
      .join("")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text) {
      units.push({ key: `pdf-p${p}`, text });
      total += text.length;
    }
  }
  if (!total) throw new Error("PDF không có lớp chữ (có thể là bản scan, cần OCR).");

  const chunks = chunkUnits(units, total);
  pdfCache.set(url, chunks);
  return chunks;
}

// ---------------------------------------------------------------- Google Docs (chunkId dạng doc-<thứ tự>)
// Lấy văn bản qua đường xuất .txt, cần đang đăng nhập và có quyền xem tài liệu.
export async function extractGoogleDocChunks(url: string): Promise<Chunk[]> {
  const m = url.match(/^(https:\/\/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/[^/]+)/);
  if (!m) throw new Error("Không nhận ra link Google Docs.");

  const res = await fetch(`${m[1]}/export?format=txt`, { credentials: "include" });
  const text = (await res.text()).replace(/^\uFEFF/, "").trim();
  if (!res.ok || /^<(!doctype|html)/i.test(text)) {
    throw new Error("Không đọc được nội dung Google Docs. Hãy đăng nhập đúng tài khoản có quyền xem tài liệu.");
  }
  if (!text) throw new Error("Tài liệu trống.");
  return chunkUnits([{ key: "doc", text }], text.length);
}