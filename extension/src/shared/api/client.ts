import type { ExplainRequest, ExplainResponse } from "./types";

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