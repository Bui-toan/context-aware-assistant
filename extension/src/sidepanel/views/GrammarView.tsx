import type { GrammarResponse } from "../../shared/api/types";
import { sendMessage } from "../../shared/messaging/message-bus";

export default function GrammarView({ data }: { data: GrammarResponse }) {
  const handleApply = () => {
    sendMessage("APPLY_SUGGESTION", { original: data.original, suggested: data.suggested });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.suggested);
    alert("Đã copy!");
  };

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Kết quả Ngữ pháp</h2>
      <div style={{ marginBottom: "16px" }}>
        <strong style={{ color: "#d32f2f" }}>Gốc:</strong>
        <p style={{ textDecoration: "line-through", color: "#666" }}>{data.original}</p>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <strong style={{ color: "#2e7d32" }}>Đề xuất:</strong>
        <p style={{ fontWeight: "bold" }}>{data.suggested}</p>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <strong>Lỗi phát hiện:</strong>
        <ul>{data.errors.map((e, i) => <li key={i}><b>{e.type}:</b> {e.explanation}</li>)}</ul>
      </div>
      
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={handleApply} style={{ flex: 1, padding: "8px", background: "#2e7d32", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Apply</button>
        <button onClick={handleCopy} style={{ flex: 1, padding: "8px", background: "#f3f4f6", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}>Copy</button>
      </div>
    </div>
  );
}