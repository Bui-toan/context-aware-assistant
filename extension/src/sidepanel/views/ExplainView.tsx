import type { ExplainResponse } from "../../shared/api/types";

interface Props {
  data: ExplainResponse;
}

export default function ExplainView({ data }: Props) {
  return (
    <div style={{ padding: "16px", fontFamily: "sans-serif" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>Giải thích</h2>
      
      <div style={{ marginBottom: "16px" }}>
        <strong style={{ color: "#555" }}>Nghĩa:</strong>
        <p style={{ margin: "4px 0" }}>{data.meaning}</p>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <strong style={{ color: "#555" }}>Chi tiết:</strong>
        <p style={{ margin: "4px 0" }}>{data.explanation}</p>
      </div>

      <div>
        <strong style={{ color: "#555" }}>Ví dụ:</strong>
        <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
          {data.examples.map((ex, idx) => (
            <li key={idx}>{ex}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}