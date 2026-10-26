import type { ExplainRequest, ExplainResponse, GrammarRequest, GrammarResponse, RewriteRequest, RewriteResponse } from "./types";

// Phase 6 mới chỉ dùng localhost. Phase 16 deploy sẽ đổi biến này.
const BACKEND_URL = "http://localhost:8000/api";

export async function postExplain(req: ExplainRequest): Promise<ExplainResponse> {
  const res = await fetch(`${BACKEND_URL}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail?.message || "Lỗi gọi API Explain");
  }

  return res.json();
}

export async function postGrammar(req: GrammarRequest): Promise<GrammarResponse> {
  const res = await fetch(`${BACKEND_URL}/grammar`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Lỗi kiểm tra ngữ pháp");
  return res.json();
}

export async function postRewrite(req: RewriteRequest): Promise<RewriteResponse> {
  const res = await fetch(`${BACKEND_URL}/rewrite`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Lỗi viết lại văn bản");
  return res.json();
}

export async function postSearch(req: { query: string; chunks: any[]; topK?: number }): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail?.message || "Lỗi gọi API Search");
  }

  return res.json();
}