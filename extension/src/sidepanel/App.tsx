import { useEffect, useState } from "react";
import ExplainView from "./views/ExplainView";
import type { ExplainResponse } from "../shared/api/types";
import { onTabMessage } from "../shared/messaging/message-bus";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explainData, setExplainData] = useState<ExplainResponse | null>(null);

  useEffect(() => {
    // Lắng nghe kết quả từ Service Worker
    onTabMessage("RESULT_READY", (payload: any) => {
      if (payload.actionType === "explain") {
        setExplainData(payload.data);
        setLoading(false);
        setError(null);
      }
    });

    onTabMessage("ERROR", (payload: any) => {
      setError(payload.message);
      setLoading(false);
      setExplainData(null);
    });

    // Lắng nghe khi user bấm nút Explain (để bật loading)
    // Vì bản chất là gửi từ Content Script -> Service Worker -> Side Panel
    // Ta có thể lắng nghe thêm message REQUEST_EXPLAIN từ SW để set loading
    onTabMessage("REQUEST_EXPLAIN", () => {
      setLoading(true);
      setError(null);
    });
  }, []);

  return (
    <div style={{ padding: "16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "20px", margin: "0 0 16px 0", color: "#1a73e8" }}>
        Context-Aware Assistant
      </h1>

      {loading && (
        <div style={{ color: "#666" }}>Đang phân tích bằng AI, vui lòng chờ...</div>
      )}

      {error && (
        <div style={{ color: "red", padding: "8px", background: "#ffebee", borderRadius: "4px" }}>
          Lỗi: {error}
        </div>
      )}

      {!loading && !error && explainData && <ExplainView data={explainData} />}

      {!loading && !error && !explainData && (
        <p style={{ color: "#666" }}>Bôi đen văn bản trên trang web và bấm "Explain" để bắt đầu.</p>
      )}
    </div>
  );
}