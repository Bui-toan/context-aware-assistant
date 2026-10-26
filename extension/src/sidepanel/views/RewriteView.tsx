import type { RewriteResponse } from "../../shared/api/types";
import { sendMessage } from "../../shared/messaging/message-bus";

export default function RewriteView({ data }: { data: RewriteResponse }) {
  const isLowSimilarity = data.verification.semanticSimilarity < 0.75;

  const handleApply = () => {
    sendMessage("APPLY_SUGGESTION", { original: "", suggested: data.rewritten });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.rewritten);
    alert("Đã copy!");
  };

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Văn bản viết lại</h2>
      <div style={{ padding: "12px", background: "#f3f4f6", borderRadius: "6px", marginBottom: "16px", whiteSpace: "pre-wrap" }}>
        {data.rewritten}
      </div>
      
      {isLowSimilarity && (
        <p style={{ color: "#d32f2f", fontSize: "14px", background: "#ffebee", padding: "8px", borderRadius: "4px", marginBottom: "16px" }}>
          ⚠️ Cảnh báo: Ý nghĩa thay đổi nhiều ({(data.verification.semanticSimilarity * 100).toFixed(1)}%)
        </p>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={handleApply} style={{ flex: 1, padding: "8px", background: "#1a73e8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Apply</button>
        <button onClick={handleCopy} style={{ flex: 1, padding: "8px", background: "#f3f4f6", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}>Copy</button>
      </div>
    </div>
  );
}