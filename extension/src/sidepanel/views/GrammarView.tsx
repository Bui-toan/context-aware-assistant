import type { GrammarResponse } from "../../shared/api/types";
export default function GrammarView({ data }: { data: GrammarResponse }) {
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
      <div>
        <strong>Lỗi phát hiện:</strong>
        <ul>{data.errors.map((e, i) => <li key={i}><b>{e.type}:</b> {e.explanation}</li>)}</ul>
      </div>
    </div>
  );
}