import { useEffect, useState } from "react";
import { sendMessage } from "../../shared/messaging/message-bus";
import { theme, commonStyles } from "../styles";

interface Props {
  data: any; loading: boolean; error: string | null;
  onCheck: (text: string) => void; initialText: string; t: any;
}

export default function GrammarView({ data, loading, error, onCheck, initialText, t }: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  return (
    <div>
      <textarea 
        placeholder={t.grammar_input} value={text} onChange={(e) => setText(e.target.value)}
        style={{ ...commonStyles.input, height: "100px", resize: "vertical", marginBottom: "12px" }}
      />
      <button onClick={() => onCheck(text)} disabled={loading || !text.trim()} style={{ ...commonStyles.buttonPrimary, width: "100%", marginBottom: "20px" }}>
        {loading ? t.loading : t.grammar_btn}
      </button>

      {error && <div style={{ color: theme.danger, background: "#fee2e2", padding: "12px", borderRadius: theme.radiusMd, marginBottom: "16px" }}>{error}</div>}

      {data && (
        <div>
          {/* Bảng điểm & Văn phong */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div style={{ ...commonStyles.card, flex: 1, textAlign: "center", marginBottom: 0, borderTop: `4px solid ${data.score > 80 ? theme.success : data.score > 50 ? theme.warning : theme.danger}` }}>
              <p style={{ fontSize: "12px", color: theme.textMuted, margin: "0 0 8px 0" }}>Điểm ngữ pháp</p>
              <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: data.score > 80 ? theme.success : theme.textMain }}>{data.score}/100</p>
            </div>
            <div style={{ ...commonStyles.card, flex: 1, textAlign: "center", marginBottom: 0 }}>
              <p style={{ fontSize: "12px", color: theme.textMuted, margin: "0 0 8px 0" }}>Văn phong</p>
              <p style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: theme.primary }}>{data.tone}</p>
            </div>
          </div>

          {/* Nhận xét */}
          <div style={{ ...commonStyles.card, background: "#f8fafc" }}>
            <p style={{ fontSize: "14px", margin: 0, color: theme.textMain }}><strong>Nhận xét:</strong> {data.overall_feedback}</p>
          </div>

          <div style={commonStyles.card}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: theme.textMuted, marginBottom: "8px" }}>{t.grammar_original}</p>
            <p style={{ margin: 0, fontSize: "14px", color: theme.danger, textDecoration: "line-through", background: "#fef2f2", padding: "8px", borderRadius: theme.radiusSm }}>{data.original}</p>
          </div>
          
          <div style={commonStyles.card}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: theme.primary, marginBottom: "8px" }}>{t.grammar_suggested}</p>
            <p style={{ margin: 0, fontSize: "15px", color: theme.success, background: "#f0fdf4", padding: "8px", borderRadius: theme.radiusSm }}>{data.suggested}</p>
          </div>

          {data.errors && data.errors.length > 0 && (
             <div style={{ ...commonStyles.card }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: theme.danger, marginBottom: "8px" }}>Chi tiết lỗi:</p>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: theme.textMain }}>
                  {data.errors.map((e: any, i: number) => <li key={i}><b>{e.type}:</b> {e.explanation}</li>)}
                </ul>
             </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button onClick={() => sendMessage("APPLY_SUGGESTION", { suggested: data.suggested })} style={{ ...commonStyles.buttonPrimary, flex: 1 }}>{t.btn_apply}</button>
            <button onClick={() => navigator.clipboard.writeText(data.suggested)} style={{ ...commonStyles.buttonOutline, flex: 1 }}>{t.btn_copy}</button>
          </div>
        </div>
      )}
    </div>
  );
}