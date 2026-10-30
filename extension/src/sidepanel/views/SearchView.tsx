import { useEffect, useState } from "react";
import { sendMessage } from "../../shared/messaging/message-bus";
import { theme, commonStyles } from "../styles";

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
  error: string | null;
  results: any[] | null;
  chunks: Record<string, string>;
  t: any;
  initialQuery: string;
  searchNonce: number; // tăng mỗi khi có yêu cầu tìm từ trang (kể cả cùng từ khóa)
  currentQueryText: string;
}

export default function SearchView({
  onSearch, loading, error, results, chunks, t, initialQuery, searchNonce, currentQueryText,
}: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (initialQuery.trim()) {
      setQuery(initialQuery);
      onSearch(initialQuery.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, searchNonce]);

  const submit = () => {
    const q = query.trim();
    if (q && !loading) onSearch(q);
  };

  const handleHighlight = (chunkId: string) => {
    // Gửi kèm text để fallback nếu DOM thay đổi (PDF và Docs không dùng tới text này)
    sendMessage("HIGHLIGHT_CHUNK", { chunkId, text: chunks[chunkId] });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search_placeholder}
          style={commonStyles.input}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button
          onClick={submit}
          disabled={loading || !query.trim()}
          style={{ ...commonStyles.buttonPrimary, padding: "8px 20px" }}
        >
          {loading ? "..." : t.search_btn}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", color: theme.primary, margin: "20px 0" }}>
          ⏳ {t.loading} "<b>{currentQueryText}</b>"...
        </div>
      )}

      {error && (
        <div style={{ color: theme.danger, background: "#fee2e2", padding: "12px", borderRadius: theme.radiusMd, marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {!loading && results && (
        <div>
          <p style={{ color: theme.textMuted, fontSize: "13px", marginBottom: "12px" }}>
            {t.search_found} {results.length} {t.search_results}
          </p>

          {results.length === 0 && (
            <p style={{ color: theme.textMuted, fontSize: "14px" }}>{t.search_empty}</p>
          )}

          {results.map((r, i) => (
            <div
              key={r.chunkId}
              onClick={() => handleHighlight(r.chunkId)}
              style={{ ...commonStyles.card, cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ color: theme.primary, fontSize: "15px" }}>{t.search_result} {i + 1}</strong>
                <span style={{ fontSize: "12px", background: "#eff6ff", color: theme.primary, padding: "2px 8px", borderRadius: theme.radiusFull, fontWeight: 600 }}>
                  {(r.score * 100).toFixed(1)}%
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "14px", color: theme.textMain, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {chunks[r.chunkId] || t.no_content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}