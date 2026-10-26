import { useState } from "react";
import { sendMessage } from "../../shared/messaging/message-bus";

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
  error: string | null;
  results: any[] | null;
  chunks: Record<string, string>;
}

export default function SearchView({ onSearch, loading, error, results, chunks }: Props) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (query.trim()) onSearch(query);
  };

  const handleHighlight = (chunkId: string) => {
    // Gửi lệnh xuống Service Worker để yêu cầu tô sáng
    sendMessage("HIGHLIGHT_CHUNK", { chunkId });
  };

  return (
    <div style={{ padding: "16px", fontFamily: "sans-serif" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Tìm kiếm ngữ nghĩa</h2>
      
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập câu hỏi..."
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
          <p style={{ color: "#555", fontSize: "14px" }}>Tìm thấy {results.length} kết quả (Bấm để xem):</p>
          {results.map((r, i) => (
            <div 
              key={r.chunkId} 
              onClick={() => handleHighlight(r.chunkId)}
              style={{ 
                padding: "12px", 
                border: "1px solid #eee", 
                marginBottom: "8px", 
                borderRadius: "6px",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f9f9f9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <strong style={{ color: "#1a73e8" }}>Kết quả {i + 1}</strong>
                <span style={{ fontSize: "12px", color: "#666" }}>Độ khớp: {(r.score * 100).toFixed(1)}%</span>
              </div>
              <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>
                {chunks[r.chunkId] || "Không tìm thấy nội dung"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}