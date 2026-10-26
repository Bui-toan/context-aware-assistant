import { useState } from "react";
import { sendMessage } from "../../shared/messaging/message-bus";

interface ResultItem {
  chunkId: string;
  score: number;
}

export default function SearchView() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Gửi message tới SW
      await sendMessage("REQUEST_SEARCH", { query, topK: 5 });
      
      // Lắng nghe phản hồi (xem Bước 7)
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "16px", fontFamily: "sans-serif" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Tìm kiếm ngữ nghĩa</h2>
      
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập câu hỏi (VD: hợp âm guitar)..."
          style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Tìm
        </button>
      </div>

      {loading && <p>Đang quét trang và phân tích AI...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {!loading && results && (
        <div>
          <p style={{ color: "#555", fontSize: "14px" }}>Tìm thấy {results.length} kết quả:</p>
          {results.map((r, i) => (
            <div key={r.chunkId} style={{ padding: "8px", border: "1px solid #eee", marginBottom: "8px", borderRadius: "4px" }}>
              <strong>Kết quả {i + 1}</strong> (Độ khớp: {(r.score * 100).toFixed(1)}%)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}