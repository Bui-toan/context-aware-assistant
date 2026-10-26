import { useEffect, useState } from "react";

export default function SettingsView() {
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [mode, setMode] = useState("formal");
  const [saved, setSaved] = useState(false);

  // Load settings khi mở tab
  useEffect(() => {
    chrome.storage.local.get(["language", "defaultRewriteMode"], (res) => {
      if (res.language) setLanguage(res.language);
      if (res.defaultRewriteMode) setMode(res.defaultRewriteMode);
    });
  }, []);

  const handleSave = () => {
    chrome.storage.local.set({
      language: language,
      defaultRewriteMode: mode
    }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000); // Ẩn thông báo sau 2s
    });
  };

  return (
    <div style={{ padding: "16px", fontFamily: "sans-serif" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Cài đặt hệ thống</h2>
      
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Ngôn ngữ mặc định:</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value as "vi" | "en")} style={{ width: "100%", padding: "8px" }}>
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Chế độ Rewrite mặc định:</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ width: "100%", padding: "8px" }}>
          <option value="formal">Formal (Trang trọng)</option>
          <option value="casual">Casual (Thân mật)</option>
          <option value="academic">Academic (Học thuật)</option>
          <option value="shorten">Shorten (Rút gọn)</option>
          <option value="improve">Improve (Cải thiện)</option>
        </select>
      </div>

      <button onClick={handleSave} style={{ width: "100%", padding: "10px", background: "#1a73e8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
        Lưu cài đặt
      </button>

      {saved && <p style={{ color: "green", marginTop: "12px", textAlign: "center" }}>✅ Đã lưu thành công!</p>}
    </div>
  );
}