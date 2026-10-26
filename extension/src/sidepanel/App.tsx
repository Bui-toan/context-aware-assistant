import { useEffect, useState } from "react";
import ExplainView from "./views/ExplainView";
import SearchView from "./views/SearchView";
import GrammarView from "./views/GrammarView";
import RewriteView from "./views/RewriteView";
import SettingsView from "./views/SettingsView";
import { onTabMessage, sendMessage } from "../shared/messaging/message-bus";
import { theme } from "./styles";
import { translations, Lang } from "./i18n";

export default function App() {
  const [activeTab, setActiveTab] = useState<"explain" | "search" | "grammar" | "rewrite" | "settings">("explain");
  const [lang, setLang] = useState<Lang>("vi");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  
  const [explainData, setExplainData] = useState<any>(null);
  const [grammarData, setGrammarData] = useState<any>(null);
  const [rewriteData, setRewriteData] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchChunks, setSearchChunks] = useState<Record<string, string>>({});
  
  const [pageSelectedText, setPageSelectedText] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState(""); // Lưu query từ Content Script

  const t = translations[lang];

  useEffect(() => {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.language) setLang(changes.language.newValue);
    });
    chrome.storage.local.get(["language"], (res) => { if (res.language) setLang(res.language); });

    const messageListener = (msg: any) => {
      if (msg.type === "SWITCH_TAB" && msg.payload?.tab) setActiveTab(msg.payload.tab);
    };
    chrome.runtime.onMessage.addListener(messageListener);

   // Lắng nghe bắt đầu xử lý
    (["explain", "grammar", "rewrite"] as const).forEach(action => {
      onTabMessage(`REQUEST_${action.toUpperCase()}` as any, (payload: any) => {
        setLoading(prev => ({ ...prev, [action]: true }));
        setErrors(prev => ({ ...prev, [action]: null }));
        if (payload?.text) setPageSelectedText(payload.text);
        // Tự động chuyển tab tương ứng khi có request từ trang web
        setActiveTab(action as any);
      });
    });

    // Xử lý riêng cho Search
    onTabMessage("REQUEST_SEARCH", (payload: any) => {
        setLoading(prev => ({ ...prev, search: true }));
        setErrors(prev => ({ ...prev, search: null }));
        if (payload?.query) setGlobalSearchQuery(payload.query); // Ghi nhận query
        setActiveTab("search"); // Chuyển tab
    });

    onTabMessage("RESULT_READY", (payload: any) => {
      setLoading(prev => ({ ...prev, [payload.actionType]: false }));
      if (payload.actionType === "explain") setExplainData(payload.data);
      if (payload.actionType === "grammar") setGrammarData(payload.data);
      if (payload.actionType === "rewrite") setRewriteData(payload.data);
      if (payload.actionType === "search") {
        setSearchResults(payload.data.results);
        const map: Record<string, string> = {};
        payload.data.originalChunks.forEach((c: any) => map[c.chunkId] = c.text);
        setSearchChunks(map);
      }
    });

    onTabMessage("ERROR", (payload: any) => {
      const action = payload.actionType || activeTab;
      setLoading(prev => ({ ...prev, [action]: false }));
      setErrors(prev => ({ ...prev, [action]: payload.message }));
    });

    return () => { chrome.runtime.onMessage.removeListener(messageListener); };
  }, [activeTab]);

  const handleSearch = async (query: string) => {
    setLoading(prev => ({ ...prev, search: true }));
    setErrors(prev => ({ ...prev, search: null }));
    setSearchResults(null);
    try { await sendMessage("REQUEST_SEARCH", { query, topK: 5 }); } 
    catch (err: any) { setErrors(prev => ({ ...prev, search: err.message })); setLoading(prev => ({ ...prev, search: false })); }
  };

  const handleGrammarCheck = async (text: string) => {
    setLoading(prev => ({ ...prev, grammar: true }));
    setErrors(prev => ({ ...prev, grammar: null }));
    await sendMessage("REQUEST_GRAMMAR", { text, context: "", language: lang });
  };

  const handleRewrite = async (text: string, mode: string) => {
    setLoading(prev => ({ ...prev, rewrite: true }));
    setErrors(prev => ({ ...prev, rewrite: null }));
    await sendMessage("REQUEST_REWRITE", { text, context: "", mode, language: lang });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "explain": return explainData ? <ExplainView data={explainData} /> : <div style={{ textAlign: "center", color: theme.textMuted, marginTop: 40 }}>{t.empty_explain}</div>;
      case "search": return <SearchView initialQuery={globalSearchQuery} onSearch={handleSearch} loading={loading.search} error={errors.search} results={searchResults} chunks={searchChunks} t={t} />;
      case "grammar": return <GrammarView data={grammarData} loading={loading.grammar} error={errors.grammar} onCheck={handleGrammarCheck} initialText={pageSelectedText} t={t} />;
      case "rewrite": return <RewriteView data={rewriteData} loading={loading.rewrite} error={errors.rewrite} onRewrite={handleRewrite} initialText={pageSelectedText} t={t} />;
      case "settings": return <SettingsView />;
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, sans-serif", height: "100vh", display: "flex", flexDirection: "column", backgroundColor: theme.background }}>
      {/* Header & Tabs */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", color: theme.primary }}>
           <div style={{ background: theme.primary, color: "white", width: "24px", height: "24px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>C</div>
           Context Assistant
        </div>
        <button onClick={() => setActiveTab("settings")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>⚙️</button>
      </div>

      <div style={{ display: "flex", padding: "10px 16px", gap: "6px", overflowX: "auto", background: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
        {[
          { id: "explain", label: t.tab_explain }, { id: "search", label: t.tab_search }, { id: "grammar", label: t.tab_grammar }, { id: "rewrite", label: t.tab_rewrite }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{ padding: "6px 14px", borderRadius: theme.radiusFull, border: "none", cursor: "pointer", fontSize: "13px", whiteSpace: "nowrap", fontWeight: activeTab === tab.id ? 600 : 500, backgroundColor: activeTab === tab.id ? theme.primary : "#f1f5f9", color: activeTab === tab.id ? "#fff" : theme.textMuted }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {renderContent()}
      </div>
    </div>
  );
}