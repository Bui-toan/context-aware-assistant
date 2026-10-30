import { useEffect, useRef, useState } from "react";
import ExplainView from "./views/ExplainView";
import SearchView from "./views/SearchView";
import GrammarView from "./views/GrammarView";
import RewriteView from "./views/RewriteView";
import SettingsView from "./views/SettingsView";
import { onTabMessage, sendMessage } from "../shared/messaging/message-bus";
import { theme } from "./styles";
import { translations, type Lang } from "./i18n";

type TabId = "explain" | "search" | "grammar" | "rewrite";
type ViewId = TabId | "settings";
type ListenType = Parameters<typeof onTabMessage>[0];

const REQUESTS = [
  { action: "explain", type: "REQUEST_EXPLAIN" },
  { action: "grammar", type: "REQUEST_GRAMMAR" },
  { action: "rewrite", type: "REQUEST_REWRITE" },
] as const;

const TAB_IDS: TabId[] = ["explain", "search", "grammar", "rewrite"];

function isTabId(x: unknown): x is TabId {
  return typeof x === "string" && (TAB_IDS as string[]).includes(x);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewId>("explain");
  const [prevTab, setPrevTab] = useState<TabId>("explain");
  const [lang, setLang] = useState<Lang>("vi");

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const [explainData, setExplainData] = useState<any>(null);
  const [grammarData, setGrammarData] = useState<any>(null);
  const [rewriteData, setRewriteData] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchChunks, setSearchChunks] = useState<Record<string, string>>({});

  const [pageSelectedText, setPageSelectedText] = useState("");
  const [currentQueryText, setCurrentQueryText] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Ref giữ tab hiện tại để listener (đăng ký một lần) luôn đọc được giá trị mới
  const activeTabRef = useRef<ViewId>(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const t = translations[lang];

  // Hàm dịch lỗi (Tự động nhận diện lỗi mạng, lỗi API, hoặc lỗi chung)
    const translateError = (errMsg: string | undefined | null): string => {
    if (!errMsg) return t.error_generic;
    
    if (errMsg.includes("Failed to fetch") || errMsg.includes("NetworkError")) {
      return t.error_network;
    }
    
    // Thêm 2 dòng này để bắt mã lỗi từ Service Worker
    if (errMsg === "ERR_NO_CONNECTION") return t.error_no_connection;
    if (errMsg === "ERR_NO_CHUNKS") return t.error_no_chunks;
    
    if (errMsg.startsWith("ERR_")) {
      return t.error_api;
    }

    return errMsg;
  };

  const setBusy = (action: string, value: boolean) =>
    setLoading((prev) => ({ ...prev, [action]: value }));
  const setFail = (action: string, message: string | null) =>
    setErrors((prev) => ({ ...prev, [action]: message }));

  useEffect(() => {
    // ---- Ngôn ngữ ----
    chrome.storage.local.get(["language"], (res) => {
      if (res.language) setLang(res.language as Lang);
    });
    const storageListener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.language) setLang(changes.language.newValue as Lang);
    };
    chrome.storage.onChanged.addListener(storageListener);

    // ---- Lệnh đổi tab từ content script ----
    const runtimeListener = (msg: any) => {
      if (msg?.type === "SWITCH_TAB" && isTabId(msg.payload?.tab)) {
        setActiveTab(msg.payload.tab);
      }
    };
    chrome.runtime.onMessage.addListener(runtimeListener);

    // ---- Các tin nhắn qua message bus ----
    const offs: Array<() => void> = [];
    const listen = (type: ListenType, handler: (payload: any) => void) => {
      const off = onTabMessage(type, handler) as unknown;
      if (typeof off === "function") offs.push(off as () => void);
    };

    // Bôi đen trên trang rồi bấm Explain / Grammar / Rewrite
    REQUESTS.forEach(({ action, type }) => {
      listen(type, (payload) => {
        setBusy(action, true);
        setFail(action, null);
        if (payload?.text) {
          setPageSelectedText(payload.text);
          setCurrentQueryText(payload.text);
        }
        setActiveTab(action);
      });
    });

    // Bôi đen rồi bấm Search
    listen("REQUEST_SEARCH", (payload) => {
      setBusy("search", true);
      setFail("search", null);
      if (payload?.query) {
        setGlobalSearchQuery(payload.query);
        setCurrentQueryText(payload.query);
      }
      setActiveTab("search");
    });

    // Kết quả trả về
    listen("RESULT_READY", (payload) => {
      const action = payload?.actionType as string | undefined;
      if (!action) return;
      setBusy(action, false);
      setFail(action, null);

      if (action === "explain") setExplainData(payload.data);
      else if (action === "grammar") setGrammarData(payload.data);
      else if (action === "rewrite") setRewriteData(payload.data);
      else if (action === "search") {
        setSearchResults(payload.data?.results ?? []);
        const map: Record<string, string> = {};
        payload.data?.originalChunks?.forEach((c: any) => {
          map[c.chunkId] = c.text;
        });
        setSearchChunks(map);
      }
    });

    // Lỗi (Tự động dịch)
    listen("ERROR", (payload) => {
      const message: string = translateError(payload?.message);
      const action = payload?.actionType as string | undefined;
      if (action) {
        setBusy(action, false);
        setFail(action, message);
      } else {
        setLoading({});
        const cur = activeTabRef.current;
        if (cur !== "settings") setFail(cur, message);
      }
    });

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
      chrome.runtime.onMessage.removeListener(runtimeListener);
      offs.forEach((off) => off());
    };
  }, [lang]); // Thêm lang vào dependency để hàm translateError luôn cập nhật ngôn ngữ mới nhất

  // ---- Gọi từ giao diện ----
  const handleSearch = async (query: string) => {
    setBusy("search", true);
    setFail("search", null);
    setSearchResults(null);
    setCurrentQueryText(query);
    try {
      await sendMessage("REQUEST_SEARCH", { query, topK: 5 });
    } catch (err: any) {
      setFail("search", translateError(err?.message));
      setBusy("search", false);
    }
  };

  const handleExplain = async (text: string) => {
    setBusy("explain", true);
    setFail("explain", null);
    setCurrentQueryText(text);
    setExplainData(null); // Xóa kết quả cũ
    try {
      await sendMessage("REQUEST_EXPLAIN", { text, context: "", language: lang });
    } catch (err: any) {
      setFail("explain", translateError(err?.message));
      setBusy("explain", false);
    }
  };

  const handleGrammarCheck = async (text: string) => {
    setBusy("grammar", true);
    setFail("grammar", null);
    setCurrentQueryText(text);
    try {
      await sendMessage("REQUEST_GRAMMAR", { text, context: "", language: lang });
    } catch (err: any) {
      setFail("grammar", translateError(err?.message));
      setBusy("grammar", false);
    }
  };

  const handleRewrite = async (text: string, mode: string) => {
    setBusy("rewrite", true);
    setFail("rewrite", null);
    setCurrentQueryText(text);
    try {
      await sendMessage("REQUEST_REWRITE", { text, context: "", mode, language: lang });
    } catch (err: any) {
      setFail("rewrite", translateError(err?.message));
      setBusy("rewrite", false);
    }
  };

  const openSettings = () => {
    const cur = activeTabRef.current;
    if (cur !== "settings") setPrevTab(cur);
    setActiveTab("settings");
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "explain", label: t.tab_explain },
    { id: "search", label: t.tab_search },
    { id: "grammar", label: t.tab_grammar },
    { id: "rewrite", label: t.tab_rewrite },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "explain":
        return (
          <ExplainView
            data={explainData}
            loading={loading.explain}
            error={errors.explain}
            currentQueryText={currentQueryText}
            initialText={pageSelectedText}
            onExplain={handleExplain}
            t={t}
          />
        );
      case "search":
        return (
          <SearchView
            initialQuery={globalSearchQuery}
            currentQueryText={currentQueryText}
            onSearch={handleSearch}
            loading={loading.search}
            error={errors.search}
            results={searchResults}
            chunks={searchChunks}
            t={t}
          />
        );
      case "grammar":
        return (
          <GrammarView
            data={grammarData}
            loading={loading.grammar}
            error={errors.grammar}
            onCheck={handleGrammarCheck}
            initialText={pageSelectedText}
            currentQueryText={currentQueryText}
            t={t}
          />
        );
      case "rewrite":
        return (
          <RewriteView
            data={rewriteData}
            loading={loading.rewrite}
            error={errors.rewrite}
            onRewrite={handleRewrite}
            initialText={pageSelectedText}
            currentQueryText={currentQueryText}
            t={t}
          />
        );
      case "settings":
        return <SettingsView lang={lang} t={t} />;
    }
  };

  const inSettings = activeTab === "settings";
  const iconBtn: React.CSSProperties = {
    width: 40,
    height: 40,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.textMuted,
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.background,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 12px 8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: theme.surface,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        {inSettings ? (
          <>
            <button
              onClick={() => setActiveTab(prevTab)}
              aria-label={lang === "vi" ? "Quay lại" : "Back"}
              style={{ ...iconBtn, background: "none" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div style={{ flex: 1, fontWeight: 600, color: theme.primary }}>
              {t.settings_title}
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, fontWeight: "bold", color: theme.primary }}>
              <div
                style={{
                  background: theme.primary,
                  color: "white",
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                C
              </div>
              Context Assistant
            </div>
            <button
              onClick={openSettings}
              aria-label={lang === "vi" ? "Cài đặt" : "Settings"}
              style={{ ...iconBtn, background: "none" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thanh tab (ẩn khi đang ở Cài đặt) */}
      {!inSettings && (
        <div
          style={{
            display: "flex",
            padding: "10px 16px",
            gap: 6,
            overflowX: "auto",
            background: theme.surface,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              style={{
                padding: "6px 14px",
                borderRadius: theme.radiusFull,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                whiteSpace: "nowrap",
                fontWeight: activeTab === tab.id ? 600 : 500,
                backgroundColor: activeTab === tab.id ? theme.primary : "#f1f5f9",
                color: activeTab === tab.id ? "#fff" : theme.textMuted,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Nội dung */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>{renderContent()}</div>
    </div>
  );
}