import { useEffect, useState } from "react";
import { theme, commonStyles } from "../styles";

export default function SettingsView() {
  const [language, setLanguage] = useState("vi");
  const [mode, setMode] = useState("formal");
  const [maxContext, setMaxContext] = useState("500");
  const [backendUrl, setBackendUrl] = useState("http://localhost:8000/api");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["language", "defaultRewriteMode", "maxContext", "backendUrl"], (res) => {
      if (res.language) setLanguage(res.language);
      if (res.defaultRewriteMode) setMode(res.defaultRewriteMode);
      if (res.maxContext) setMaxContext(res.maxContext);
      if (res.backendUrl) setBackendUrl(res.backendUrl);
    });
  }, []);

  const handleSave = () => {
    chrome.storage.local.set({
      language, defaultRewriteMode: mode, maxContext, backendUrl
    }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const labelStyle = { display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: theme.textMain };
  const groupStyle = { marginBottom: "16px" };

  return (
    <div>
      <div style={groupStyle}>
        <label style={labelStyle}>Ngôn ngữ trả lời</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={commonStyles.input}>
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Chế độ viết lại mặc định</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)} style={commonStyles.input}>
          <option value="formal">Trang trọng</option>
          <option value="casual">Thân mật</option>
          <option value="academic">Học thuật</option>
        </select>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Độ dài ngữ cảnh tối đa</label>
        <input type="number" value={maxContext} onChange={(e) => setMaxContext(e.target.value)} style={commonStyles.input} />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>URL API Backend</label>
        <input type="text" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} style={commonStyles.input} />
      </div>

      <button onClick={handleSave} style={{ ...commonStyles.buttonPrimary, width: "100%", padding: "12px", marginTop: "8px" }}>
        Lưu cài đặt
      </button>

      {saved && <p style={{ color: theme.success, textAlign: "center", marginTop: "12px", fontSize: "14px" }}>✅ Đã lưu thành công!</p>}
    </div>
  );
}