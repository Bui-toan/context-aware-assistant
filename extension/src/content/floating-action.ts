import type { SelectionInfo } from "./selection-detector";

export type FloatingActionType = "search" | "explain" | "grammar" | "rewrite";
type ActionCallback = (action: FloatingActionType, info: SelectionInfo) => void;

const HOST_ID = "caa-floating-action-host";
const TOOLBAR_WIDTH = 320;
const TOOLBAR_HEIGHT = 40;
const OFFSET_Y = 8;

let hostEl: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let currentSelection: SelectionInfo | null = null;
let actionCallback: ActionCallback | null = null;

function ensureToolbar(lang: "vi" | "en" = "vi"): void {
  if (hostEl) {
    const buttons = shadowRoot?.querySelectorAll(".btn");
    if (buttons && buttons.length === 4) {
      const labels = lang === "vi" 
        ? ["Tìm kiếm", "Giải thích", "Ngữ pháp", "Viết lại"] 
        : ["Search", "Explain", "Grammar", "Rewrite"];
      buttons.forEach((btn, idx) => btn.textContent = labels[idx]);
    }
    return;
  }

  hostEl = document.createElement("div");
  hostEl.id = HOST_ID;
  hostEl.style.position = "absolute";
  hostEl.style.top = "0"; hostEl.style.left = "0";
  hostEl.style.zIndex = "2147483647"; hostEl.style.display = "none";

  shadowRoot = hostEl.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    .toolbar { display: flex; gap: 4px; padding: 4px; background: #1f2937; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: system-ui, sans-serif; }
    .btn { border: none; background: transparent; color: #fff; font-size: 13px; padding: 6px 10px; border-radius: 4px; cursor: pointer; white-space: nowrap; }
    .btn:hover { background: #374151; }
  `;
  shadowRoot.appendChild(style);

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const labels = lang === "vi" 
    ? ["Tìm kiếm", "Giải thích", "Ngữ pháp", "Viết lại"] 
    : ["Search", "Explain", "Grammar", "Rewrite"];
  const types: FloatingActionType[] = ["search", "explain", "grammar", "rewrite"];

  types.forEach((type, index) => {
    const btn = document.createElement("button");
    btn.className = "btn"; 
    btn.textContent = labels[index];
    btn.addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); });
    btn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      if (currentSelection) actionCallback?.(type, currentSelection);
      hide();
    });
    toolbar.appendChild(btn);
  });

  shadowRoot.appendChild(toolbar);
  document.body.appendChild(hostEl);
}

export function show(info: SelectionInfo, lang: "vi" | "en" = "vi"): void {
  ensureToolbar(lang);
  if (!hostEl || !info.rect) return;
  
  currentSelection = info;
  const rect = info.rect;
  const scrollX = window.scrollX; const scrollY = window.scrollY;
  
  let top = rect.top + scrollY - TOOLBAR_HEIGHT - OFFSET_Y;
  let left = rect.left + scrollX + rect.width / 2 - TOOLBAR_WIDTH / 2;
  
  if (rect.top < TOOLBAR_HEIGHT + OFFSET_Y) top = rect.bottom + scrollY + OFFSET_Y;
  const minLeft = scrollX + 4; const maxLeft = scrollX + window.innerWidth - TOOLBAR_WIDTH - 4;
  left = Math.max(minLeft, Math.min(left, maxLeft));

  hostEl.style.top = `${top}px`; hostEl.style.left = `${left}px`; hostEl.style.display = "block";
}

export function hide(): void {
  if (hostEl) hostEl.style.display = "none";
  currentSelection = null;
}

export function onAction(cb: ActionCallback): void { actionCallback = cb; }