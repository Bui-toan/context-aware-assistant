import type { RewriteResponse } from "../../shared/api/types";
export default function RewriteView({ data }: { data: RewriteResponse }) {
  const isLowSimilarity = data.verification.semanticSimilarity < 0.75;
  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Văn bản viết lại</h2>
      <div style={{ padding: "12px", background: "#f3f4f6", borderRadius: "6px", marginBottom: "16px" }}>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.rewritten}</p>
      </div>
      {isLowSimilarity && (
        <p style={{ color: "#d32f2f", fontSize: "14px", background: "#ffebee", padding: "8px", borderRadius: "4px" }}>
          ⚠️ Cảnh báo: Ý nghĩa đã thay đổi quá nhiều (Độ tương đồng: {(data.verification.semanticSimilarity * 100).toFixed(1)}%)
        </p>
      )}
    </div>
  );
}