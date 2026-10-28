import { useEffect, useState } from "react";
import { theme, commonStyles } from "../styles";

interface Props {
  data: any;
  loading: boolean;
  error: string | null;
  currentQueryText: string;
  initialText: string; // Nhận text từ bôi đen
  onExplain: (text: string) => void; // Hàm gọi API
  t: any;
}

export default function ExplainView({ data, loading, error, currentQueryText, initialText, onExplain, t }: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      // Không tự động gọi ở đây vì App.tsx đã tự động gọi khi bôi đen
    }
  }, [initialText]);

  return (
    <div>
      {/* Ô nhập liệu cho Explain */}
      <textarea 
        placeholder={t.explain_input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ ...commonStyles.input, height: "80px", resize: "vertical", marginBottom: "12px" }}
      />
      <button onClick={() => onExplain(text)} disabled={loading || !text.trim()} style={{ ...commonStyles.buttonPrimary, width: "100%", marginBottom: "20px" }}>
        {loading ? t.loading : t.explain_btn}
      </button>

      {/* Hiển thị cụm từ đang giải thích */}
      {currentQueryText && (
        <div style={{ ...commonStyles.card, background: "#eff6ff", border: "none", marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", color: theme.primary, fontWeight: 600, marginBottom: "4px", textTransform: "uppercase" }}>
            {t.tab_explain}:
          </p>
          <p style={{ margin: 0, fontSize: "15px", color: theme.textMain, fontStyle: "italic" }}>"{currentQueryText}"</p>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", color: theme.primary, margin: "20px 0" }}>⏳ {t.loading}...</div>}
      {error && <div style={{ color: theme.danger, padding: "12px", background: "#fee2e2", borderRadius: theme.radiusMd }}>{error}</div>}

      {!loading && !error && data && (
        <div>
          <div style={commonStyles.card}>
            <p style={{ fontSize: "12px", fontWeight: "bold", color: theme.textMuted, marginBottom: "8px", textTransform: "uppercase" }}>{t.explain_meaning}</p>
            <p style={{ margin: 0, fontSize: "15px", color: theme.textMain, lineHeight: 1.5 }}>{data.meaning}</p>
          </div>

          <div style={commonStyles.card}>
            <p style={{ fontSize: "12px", fontWeight: "bold", color: theme.textMuted, marginBottom: "8px", textTransform: "uppercase" }}>{t.explain_explanation}</p>
            <p style={{ margin: 0, fontSize: "15px", color: theme.textMain, lineHeight: 1.5 }}>{data.explanation}</p>
          </div>

          <div style={commonStyles.card}>
            <p style={{ fontSize: "12px", fontWeight: "bold", color: theme.textMuted, marginBottom: "8px", textTransform: "uppercase" }}>{t.explain_examples}</p>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: theme.textMain, lineHeight: 1.6 }}>
              {data.examples.map((ex: string, i: number) => <li key={i}>{ex}</li>)}
            </ul>
          </div>
        </div>
      )}
      
      {!loading && !error && !data && <div style={{ textAlign: "center", color: theme.textMuted, marginTop: 40 }}>{t.empty_explain}</div>}
    </div>
  );
}