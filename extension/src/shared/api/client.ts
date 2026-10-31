import type { 
  ExplainRequest, ExplainResponse, 
  SearchRequest, SearchResponse, 
  GrammarRequest, GrammarResponse, 
  RewriteRequest, RewriteResponse 
} from "./types";

const BACKEND_URL = "http://localhost:8000/api";
const SECRET_TOKEN = "CAA_NHOM20_SECRET_2026"; // Phải khớp với Backend

/**
 * Hàm fetch dùng chung: Tự động thêm Header và xử lý lỗi
 */
async function fetchWithAuth(endpoint: string, options: RequestInit): Promise<any> {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Extension-Token": SECRET_TOKEN, // Gửi kèm Token bảo mật
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.detail?.message || errorData.detail || `Lỗi gọi API: ${res.status}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function postExplain(req: ExplainRequest): Promise<ExplainResponse> {
  return fetchWithAuth("/explain", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function postSearch(req: SearchRequest): Promise<SearchResponse> {
  return fetchWithAuth("/search", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function postGrammar(req: GrammarRequest): Promise<GrammarResponse> {
  return fetchWithAuth("/grammar", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function postRewrite(req: RewriteRequest): Promise<RewriteResponse> {
  return fetchWithAuth("/rewrite", {
    method: "POST",
    body: JSON.stringify(req),
  });
}