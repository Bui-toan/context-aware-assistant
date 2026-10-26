import { useEffect, useState } from "react";
import { sendMessage } from "../../shared/messaging/message-bus";
import { theme, commonStyles } from "../styles";

interface Props {
  onSearch: (query: string) => void;
  loading: boolean; error: string | null; results: any[] | null;
  chunks: Record<string, string>; t: any;
  initialQuery: string; // Nhận query bôi đen từ App
}

export default function SearchView({ onSearch, loading, error, results, chunks, t, initialQuery }: Props) {
  const [query, setQuery] = useState("");

  // Lắng nghe nếu có query bôi đen được ném sang
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);   // Điền vào ô
      onSearch(initialQuery);   // Tự động tìm luôn
    }
  }, [initialQuery]);

  const handleHighlight = (chunkId: string) => {
    sendMessage("HIGHLIGHT_CHUNK", { chunkId });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search_placeholder} style={commonStyles.input} onKeyDown={(e) => e.key === "Enter" && onSearch(query)} />
        <button onClick={() => onSearch(query)} disabled={loading} style={{ ...commonStyles.buttonPrimary, padding: "8px 20px" }}>{loading ? "..." : t.search_btn}</button>
      </div>

      {error && <div style={{ color: theme.danger, background: "#fee2e2", padding: "12px", borderRadius: theme.radiusMd, marginBottom: "16px" }}>{error}</div>}

      {results && (
        <div>
          <p style={{ color: theme.textMuted, fontSize: "13px", marginBottom: "12px" }}>{t.search_found} {results.length} {t.search_results}</p>
          {results.map((r, i) => (
            <div key={r.chunkId} onClick={() => handleHighlight(r.chunkId)} style={{ ...commonStyles.card, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ color: theme.primary, fontSize: "15px" }}>{t.search_result} {i + 1}</strong>
                <span style={{ fontSize: "12px", background: "#eff6ff", color: theme.primary, padding: "2px 8px", borderRadius: theme.radiusFull, fontWeight: 600 }}>{(r.score * 100).toFixed(1)}%</span>
              </div>
              <p style={{ margin: 0, fontSize: "14px", color: theme.textMain, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {chunks[r.chunkId] || "Không có nội dung"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}