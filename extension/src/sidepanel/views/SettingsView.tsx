import { useEffect, useState } from "react";
import { theme, commonStyles } from "../styles";

interface Props {
  lang: "vi" | "en";
  t: any;
}

export default function SettingsView({ lang, t }: Props) {
  const [language, setLanguage] = useState(lang);
  const [maxContext, setMaxContext] = useState("500"); // Mặc định 500
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLanguage(lang);
    // Đọc giới hạn từ storage khi mở tab
    chrome.storage.local.get(["maxContext"], (res) => {
      if (res.maxContext) setMaxContext(res.maxContext.toString());
    });
  }, [lang]);

  const handleSave = () => {
    chrome.storage.local.set({ 
      language, 
      maxContext: parseInt(maxContext) || 500 
    }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const labelStyle = { display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: theme.textMain };
  const groupStyle = { marginBottom: "20px" };

  return (
    <div style={{ padding: "16px" }}>
      <div style={groupStyle}>
        <label style={labelStyle}>{t.settings_lang}</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value as "vi" | "en")} style={commonStyles.input}>
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>{t.settings_limit}</label>
        <input 
          type="number" 
          value={maxContext} 
          onChange={(e) => setMaxContext(e.target.value)} 
          style={commonStyles.input} 
          min="100" 
          max="5000"
        />
      </div>

      <button onClick={handleSave} style={{ ...commonStyles.buttonPrimary, width: "100%", padding: "12px", marginTop: "8px" }}>
        {t.settings_save}
      </button>

      {saved && <p style={{ color: theme.success, textAlign: "center", marginTop: "12px", fontSize: "14px" }}>✅ {t.settings_saved}</p>}
    </div>
  );
}