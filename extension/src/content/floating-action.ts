// =============================================================================
// Floating Action — toolbar nổi hiện khi user bôi đen văn bản.
// Theo SDS §5.6. Dùng Shadow DOM để cô lập CSS với trang.
// =============================================================================

import type { SelectionInfo } from "./selection-detector";

export type FloatingActionType = "explain" | "grammar" | "rewrite";

type ActionCallback = (action: FloatingActionType, info: SelectionInfo) => void;

const HOST_ID = "caa-floating-action-host";
const TOOLBAR_WIDTH = 240;
const TOOLBAR_HEIGHT = 40;
const OFFSET_Y = 8;

let hostEl: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let currentSelection: SelectionInfo | null = null;
let actionCallback: ActionCallback | null = null;

/**
 * Khởi tạo host + shadow DOM (chỉ chạy 1 lần cho cả vòng đời content script).
 */
function ensureToolbar(): void {
  if (hostEl) return;

  hostEl = document.createElement("div");
  hostEl.id = HOST_ID;
  hostEl.style.position = "absolute";
  hostEl.style.top = "0";
  hostEl.style.left = "0";
  hostEl.style.zIndex = "2147483647";
  hostEl.style.display = "none";

  shadowRoot = hostEl.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    .toolbar {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: #1f2937;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .btn {
      border: none;
      background: transparent;
      color: #fff;
      font-size: 13px;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn:hover { background: #374151; }
    .btn:active { background: #4b5563; }
  `;
  shadowRoot.appendChild(style);

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const actions: Array<{ type: FloatingActionType; label: string }> = [
    { type: "explain", label: "Explain" },
    { type: "grammar", label: "Grammar" },
    { type: "rewrite", label: "Rewrite" },
  ];

  for (const { type, label } of actions) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = label;
    btn.dataset.action = type;

    // Ngăn mất selection khi bấm toolbar
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentSelection) {
        actionCallback?.(type, currentSelection);
      }
      hide();
    });

    toolbar.appendChild(btn);
  }

  shadowRoot.appendChild(toolbar);
  document.body.appendChild(hostEl);
}

/**
 * Hiện toolbar tại vị trí phù hợp với selection rect.
 */
export function show(info: SelectionInfo): void {
  ensureToolbar();
  if (!hostEl || !info.rect) return;

  currentSelection = info;

  const rect = info.rect;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // Mặc định: phía trên selection
  let top = rect.top + scrollY - TOOLBAR_HEIGHT - OFFSET_Y;
  let left = rect.left + scrollX + rect.width / 2 - TOOLBAR_WIDTH / 2;

  // Nếu không đủ chỗ phía trên → đặt dưới
  if (rect.top < TOOLBAR_HEIGHT + OFFSET_Y) {
    top = rect.bottom + scrollY + OFFSET_Y;
  }

  // Clamp ngang để không tràn viewport
  const minLeft = scrollX + 4;
  const maxLeft = scrollX + window.innerWidth - TOOLBAR_WIDTH - 4;
  left = Math.max(minLeft, Math.min(left, maxLeft));

  hostEl.style.top = `${top}px`;
  hostEl.style.left = `${left}px`;
  hostEl.style.display = "block";
}

/**
 * Ẩn toolbar.
 */
export function hide(): void {
  if (hostEl) hostEl.style.display = "none";
  currentSelection = null;
}

/**
 * Đăng ký callback khi user bấm 1 trong 3 nút.
 */
export function onAction(cb: ActionCallback): void {
  actionCallback = cb;
}