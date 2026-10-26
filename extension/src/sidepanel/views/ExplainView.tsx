import { theme, commonStyles } from "../styles";

export default function ExplainView({ data }: { data: any }) {
  return (
    <div>
      <div style={commonStyles.card}>
        <p style={{ fontSize: "12px", fontWeight: "bold", color: theme.textMuted, marginBottom: "8px", textTransform: "uppercase" }}>Ý nghĩa</p>
        <p style={{ margin: 0, fontSize: "15px", color: theme.textMain, lineHeight: 1.5 }}>{data.meaning}</p>
      </div>

      <div style={commonStyles.card}>
        <p style={{ fontSize: "12px", fontWeight: "bold", color: theme.textMuted, marginBottom: "8px", textTransform: "uppercase" }}>Giải thích</p>
        <p style={{ margin: 0, fontSize: "15px", color: theme.textMain, lineHeight: 1.5 }}>{data.explanation}</p>
      </div>

      <div style={commonStyles.card}>
        <p style={{ fontSize: "12px", fontWeight: "bold", color: theme.textMuted, marginBottom: "8px", textTransform: "uppercase" }}>Ví dụ</p>
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: theme.textMain, lineHeight: 1.6 }}>
          {data.examples.map((ex: string, i: number) => <li key={i}>{ex}</li>)}
        </ul>
      </div>
    </div>
  );
}