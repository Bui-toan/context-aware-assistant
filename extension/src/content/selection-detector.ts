export type SelectionSource = "window" | "input" | "textarea" | "contenteditable";

export interface SelectionInfo {
  text: string;
  rect: DOMRect | null;
  source: SelectionSource;
  node: Node | null;
}

type SelectionCallback = (info: SelectionInfo | null) => void;

let listener: SelectionCallback | null = null;
let rafId: number | null = null;
let lastText = "";

export let lastSavedElement: HTMLElement | null = null;

// Hàm để reset element từ file khác (thay vì gán trực tiếp)
export function clearSavedElement() {
  lastSavedElement = null;
}

export function getCurrentSelection(): SelectionInfo | null {
  // 1. Input / Textarea
  const active = document.activeElement as HTMLElement | null;
  if (active) {
    const tag = active.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") {
      const el = active as HTMLInputElement | HTMLTextAreaElement;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      if (end > start) {
        const text = el.value.substring(start, end).trim();
        if (text) {
          lastSavedElement = el;
          return { text, rect: el.getBoundingClientRect(), source: tag === "input" ? "input" : "textarea", node: el };
        }
      }
    }
  }

  // 2. Văn bản thường
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

  const text = sel.toString().trim();
  if (!text) return null;

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  let source: SelectionSource = "window";
  const anchor = sel.anchorNode;
  
  // Kiểm tra xem có nằm trong contenteditable không
  if (anchor) {
    const parentEl = anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : (anchor as HTMLElement);
    if (parentEl && (parentEl.isContentEditable || parentEl.closest("[contenteditable]"))) {
      source = "contenteditable";
      lastSavedElement = parentEl; 
    } else {
      // Nếu là text thường trên web (như bài báo), KHÔNG LƯU element
      lastSavedElement = null; 
    }
  }

  return { text, rect, source, node: anchor };
}

export function onSelectionChange(cb: SelectionCallback): void {
  listener = cb;
}

export function startSelectionDetection(): void {
  document.addEventListener("mouseup", handleChange, true);
  document.addEventListener("keyup", handleChange, true);
  document.addEventListener("selectionchange", handleChange, true);
}

function handleChange(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    rafId = null;
    const info = getCurrentSelection();
    const text = info?.text ?? "";
    if (text === lastText) return;
    lastText = text;
    listener?.(info);
  });
}