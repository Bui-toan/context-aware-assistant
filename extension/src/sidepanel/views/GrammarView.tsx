import { useEffect, useState } from "react";
import { sendMessage } from "../../shared/messaging/message-bus";
import { theme, commonStyles } from "../styles";

interface Props {
  data: any;
  loading: boolean;
  error: string | null;
  onCheck: (text: string) => void;
  initialText: string;
  currentQueryText: string;
  t: any;
}

export default function GrammarView({
  data,
  loading,
  error,
  onCheck,
  initialText,
  currentQueryText,
  t,
}: Props) {
  const [text, setText] = useState("");

  // Đồng bộ văn bản từ bên ngoài (khi bôi đen trên web)
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  return (
    <div>
      {/* Ô nhập liệu */}
      <textarea
        placeholder={t.grammar_input || "Nhập hoặc dán văn bản cần kiểm tra..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          ...commonStyles.input,
          height: "100px",
          resize: "vertical",
          marginBottom: "12px",
        }}
      />

      {/* Nút Check */}
      <button
        onClick={() => onCheck(text)}
        disabled={loading || !text.trim()}
        style={{
          ...commonStyles.buttonPrimary,
          width: "100%",
          marginBottom: "20px",
          opacity: loading || !text.trim() ? 0.6 : 1,
        }}
      >
        {loading ? t.loading : t.grammar_btn || "Check"}
      </button>

      {/* Trạng thái Loading */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            color: theme.primary,
            margin: "20px 0",
            fontSize: "14px",
          }}
        >
          ⏳ {t.loading} "<b>{currentQueryText}</b>"...
        </div>
      )}

      {/* Trạng thái Lỗi */}
      {error && (
        <div
          style={{
            color: theme.danger,
            background: "#fee2e2",
            padding: "12px",
            borderRadius: theme.radiusMd,
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Hiển thị kết quả */}
      {!loading && data && (
        <div>
          {/* Bảng điểm & Văn phong */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div
              style={{
                ...commonStyles.card,
                flex: 1,
                textAlign: "center",
                marginBottom: 0,
                borderTop: `4px solid ${
                  data.score > 80
                    ? theme.success
                    : data.score > 50
                    ? theme.warning
                    : theme.danger
                }`,
              }}
            >
              <p style={{ fontSize: "12px", color: theme.textMuted, margin: "0 0 8px 0" }}>
                {t.grammar_score || "Điểm ngữ pháp"}
              </p>
              <p
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  margin: 0,
                  color: data.score > 80 ? theme.success : theme.textMain,
                }}
              >
                {data.score}/100
              </p>
            </div>
            
            <div
              style={{
                ...commonStyles.card,
                flex: 1,
                textAlign: "center",
                marginBottom: 0,
              }}
            >
              <p style={{ fontSize: "12px", color: theme.textMuted, margin: "0 0 8px 0" }}>
                {t.grammar_tone || "Văn phong"}
              </p>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: 0,
                  color: theme.primary,
                }}
              >
                {data.tone}
              </p>
            </div>
          </div>

          {/* Nhận xét tổng quan */}
          <div style={{ ...commonStyles.card, background: "#f8fafc" }}>
            <p style={{ fontSize: "14px", margin: 0, color: theme.textMain }}>
              <strong>{t.grammar_feedback || "Nhận xét"}:</strong> {data.overall_feedback}
            </p>
          </div>

          {/* Văn bản gốc */}
          <div style={commonStyles.card}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: theme.textMuted, marginBottom: "8px" }}>
              {t.grammar_original || "Văn bản gốc"}:
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: theme.danger,
                textDecoration: "line-through",
                background: "#fef2f2",
                padding: "8px",
                borderRadius: theme.radiusSm,
              }}
            >
              {data.original}
            </p>
          </div>

          {/* Văn bản đề xuất */}
          <div style={commonStyles.card}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: theme.primary, marginBottom: "8px" }}>
              {t.grammar_suggested || "Đề xuất sửa"}:
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                color: theme.success,
                background: "#f0fdf4",
                padding: "8px",
                borderRadius: theme.radiusSm,
              }}
            >
              {data.suggested}
            </p>
          </div>

          {/* Chi tiết các lỗi */}
          {data.errors && data.errors.length > 0 && (
            <div style={commonStyles.card}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: theme.danger, marginBottom: "8px" }}>
                {t.grammar_error_details || "Chi tiết lỗi"}:
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: theme.textMain }}>
                {data.errors.map((e: any, i: number) => (
                  <li key={i} style={{ marginBottom: "4px" }}>
                    <b>{e.type}:</b> {e.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nút hành động */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button
              onClick={() => sendMessage("APPLY_SUGGESTION", { suggested: data.suggested })}
              style={{ ...commonStyles.buttonPrimary, flex: 1 }}
            >
              {t.btn_apply || "Thay thế văn bản"}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(data.suggested)}
              style={{ ...commonStyles.buttonOutline, flex: 1 }}
            >
              {t.btn_copy || "Sao chép"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}