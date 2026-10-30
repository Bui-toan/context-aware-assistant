import type { ExplainRequest, ExplainResponse, GrammarRequest, GrammarResponse, RewriteRequest, RewriteResponse } from "./types";

const BACKEND_URL = "http://localhost:8000/api";

export async function postExplain(req: ExplainRequest): Promise<ExplainResponse> {
  const res = await fetch(`${BACKEND_URL}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail?.message || "ERR_EXPLAIN");
  }

  return res.json();
}

export async function postGrammar(req: GrammarRequest): Promise<GrammarResponse> {
  const res = await fetch(`${BACKEND_URL}/grammar`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail?.message || "ERR_GRAMMAR");
  }
  return res.json();
}

export async function postRewrite(req: RewriteRequest): Promise<RewriteResponse> {
  const res = await fetch(`${BACKEND_URL}/rewrite`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail?.message || "ERR_REWRITE");
  }
  return res.json();
}

export async function postSearch(req: { query: string; chunks: any[]; topK?: number }): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail?.message || "ERR_SEARCH");
  }

  return res.json();
}