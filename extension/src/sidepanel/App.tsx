import { useEffect, useState } from "react";
import ExplainView from "./views/ExplainView";
import SearchView from "./views/SearchView";
import type { ExplainResponse } from "../shared/api/types";
import { onTabMessage } from "../shared/messaging/message-bus";

export default function App() {
  const [activeTab, setActiveTab] = useState<"explain" | "search">("explain");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explainData, setExplainData] = useState<ExplainResponse | null>(null);
  
  // State cho Search
  const [_searchResults, setSearchResults] = useState<any[] | null>(null);

  useEffect(() => {
    onTabMessage("REQUEST_EXPLAIN", () => {
      setActiveTab("explain");
      setLoading(true);
      setError(null);
    });

    onTabMessage("RESULT_READY", (payload: any) => {
      if (payload.actionType === "explain") {
        setExplainData(payload.data);
        setLoading(false);
      } else if (payload.actionType === "search") {
        setSearchResults(payload.data.results);
        setLoading(false);
      }
    });

    onTabMessage("ERROR", (payload: any) => {
      setError(payload.message);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Thanh Tab */}
      <div style={{ display: "flex", borderBottom: "1px solid #ccc", background: "#f5f5f5" }}>
        <button 
          onClick={() => setActiveTab("explain")}
          style={{ flex: 1, padding: "12px", border: "none", background: activeTab === "explain" ? "#fff" : "transparent", fontWeight: activeTab === "explain" ? "bold" : "normal", cursor: "pointer" }}
        >
          Explain
        </button>
        <button 
          onClick={() => setActiveTab("search")}
          style={{ flex: 1, padding: "12px", border: "none", background: activeTab === "search" ? "#fff" : "transparent", fontWeight: activeTab === "search" ? "bold" : "normal", cursor: "pointer" }}
        >
          Search
        </button>
      </div>

      {/* Nội dung */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeTab === "explain" && (
          <div style={{ padding: "16px" }}>
            {loading && <p>Đang phân tích...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && explainData && <ExplainView data={explainData} />}
            {!loading && !error && !explainData && <p style={{ color: "#666" }}>Bôi đen văn bản để Explain.</p>}
          </div>
        )}

        {activeTab === "search" && (
          <SearchView />
        )}
      </div>
    </div>
  );
}