import { useEffect, useState } from "react";
import { sendMessage } from "../../shared/messaging/message-bus";
import { theme, commonStyles } from "../styles";

interface Props {
  data: any; 
  loading?: boolean; 
  error?: string | null;
  onRewrite: (text: string, mode: string) => void; 
  initialText: string; 
  currentQueryText?: string; // Thêm prop này để hết lỗi
  t: any;
}

export default function RewriteView({ data, loading, error, onRewrite, initialText, currentQueryText, t }: Props) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("formal");

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  const modes = [
    { id: "formal", label: t.mode_formal },
    { id: "casual", label: t.mode_casual },
    { id: "academic", label: t.mode_academic },
    { id: "shorten", label: t.mode_shorten }
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        {modes.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{
              padding: "6px 14px", borderRadius: theme.radiusFull, border: "none", cursor: "pointer", fontSize: "13px",
              backgroundColor: mode === m.id ? theme.primary : "#f1f5f9",
              color: mode === m.id ? "#fff" : theme.textMuted,
            }}>
            {m.label}
          </button>
        ))}
      </div>

      <textarea 
        placeholder={t.rewrite_input} 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        style={{ ...commonStyles.input, height: "100px", resize: "vertical", marginBottom: "12px" }} 
      />
      
      <button onClick={() => onRewrite(text, mode)} disabled={loading || !text.trim()} style={{ ...commonStyles.buttonPrimary, width: "100%", marginBottom: "20px" }}>
        {loading ? t.loading : t.rewrite_btn}
      </button>

      {/* Trạng thái Loading */}
      {loading && (
        <div style={{ textAlign: "center", color: theme.primary, margin: "20px 0" }}>
          ⏳ {t.loading} "<b>{currentQueryText}</b>"...
        </div>
      )}

      {error && <div style={{ color: theme.danger, background: "#fee2e2", padding: "12px", borderRadius: theme.radiusMd, marginBottom: "16px" }}>{error}</div>}

      {!loading && data && (
        <div style={commonStyles.card}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: theme.primary, marginBottom: "8px" }}>{t.rewrite_result}</p>
          <p style={{ margin: 0, fontSize: "15px", color: theme.textMain, lineHeight: 1.6 }}>{data.rewritten}</p>
          
          {data.verification?.semanticSimilarity < 0.75 && (
            <p style={{ marginTop: "12px", fontSize: "12px", color: theme.warning, background: "#fffbeb", padding: "8px", borderRadius: theme.radiusSm }}>
              ⚠️ Cảnh báo: Ý nghĩa thay đổi nhiều ({(data.verification.semanticSimilarity * 100).toFixed(1)}%)
            </p>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button onClick={() => sendMessage("APPLY_SUGGESTION", { suggested: data.rewritten })} style={{ ...commonStyles.buttonPrimary, flex: 1 }}>{t.btn_apply}</button>
            <button onClick={() => navigator.clipboard.writeText(data.rewritten)} style={{ ...commonStyles.buttonOutline, flex: 1 }}>{t.btn_copy}</button>
          </div>
        </div>
      )}
    </div>
  );
}