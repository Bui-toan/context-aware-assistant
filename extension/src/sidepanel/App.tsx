import { useEffect, useState } from "react";
import ExplainView from "./views/ExplainView";
import SearchView from "./views/SearchView";
import GrammarView from "./views/GrammarView";
import RewriteView from "./views/RewriteView";
import { onTabMessage, sendMessage } from "../shared/messaging/message-bus";

export default function App() {
  const [activeTab, setActiveTab] = useState<"explain" | "search" | "grammar" | "rewrite">("explain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [explainData, setExplainData] = useState<any>(null);
  const [grammarData, setGrammarData] = useState<any>(null);
  const [rewriteData, setRewriteData] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchChunks, setSearchChunks] = useState<Record<string, string>>({});

  useEffect(() => {
    // Bật loading khi có request mới
    const REQUEST_TYPES = ["REQUEST_EXPLAIN", "REQUEST_GRAMMAR", "REQUEST_REWRITE"] as const;
    REQUEST_TYPES.forEach((type) => {
      onTabMessage(type, () => { setLoading(true); setError(null); });
    });

    onTabMessage("RESULT_READY", (payload: any) => {
      setLoading(false);
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
      setError(payload.message);
      setLoading(false);
    });
  }, []);

  const handleSearch = async (query: string) => {
    setLoading(true); setError(null); setSearchResults(null);
    try { await sendMessage("REQUEST_SEARCH", { query, topK: 5 }); } catch (err: any) { setError(err.message); setLoading(false); }
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #ccc", background: "#f5f5f5" }}>
        {(["explain", "search", "grammar", "rewrite"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: "10px 4px", border: "none", background: activeTab === tab ? "#fff" : "transparent", fontWeight: activeTab === tab ? "bold" : "normal", cursor: "pointer", textTransform: "capitalize" }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && <p style={{ padding: "16px", color: "#1a73e8" }}>Đang xử lý...</p>}
        {error && <p style={{ padding: "16px", color: "red" }}>{error}</p>}
        
        {!loading && !error && activeTab === "explain" && (explainData ? <ExplainView data={explainData} /> : <p style={{ padding: 16 }}>Bôi đen văn bản để Explain.</p>)}
        {!loading && !error && activeTab === "grammar" && (grammarData ? <GrammarView data={grammarData} /> : <p style={{ padding: 16 }}>Bôi đen văn bản để kiểm tra ngữ pháp.</p>)}
        {!loading && !error && activeTab === "rewrite" && (rewriteData ? <RewriteView data={rewriteData} /> : <p style={{ padding: 16 }}>Bôi đen văn bản để viết lại.</p>)}
        
        {activeTab === "search" && (
          <SearchView onSearch={handleSearch} loading={loading} error={error} results={searchResults} chunks={searchChunks} />
        )}
      </div>
    </div>
  );
}