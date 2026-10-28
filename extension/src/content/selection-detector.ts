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

// Biến toàn cục lưu trữ vùng bôi đen và element cuối cùng
export let lastSavedRange: Range | null = null;
export let lastSavedElement: HTMLElement | null = null;

export function getCurrentSelection(): SelectionInfo | null {
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
          // Lưu lại element
          lastSavedElement = el; 
          lastSavedRange = null;
          return { text, rect: el.getBoundingClientRect(), source: tag === "input" ? "input" : "textarea", node: el };
        }
      }
    }
  }

  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

  const text = sel.toString().trim();
  if (!text) return null;

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Lưu lại range và element
  lastSavedRange = range.cloneRange();
  lastSavedElement = null; // Reset nếu đang bôi đen text thường

  let source: SelectionSource = "window";
  const anchor = sel.anchorNode;
  if (anchor) {
    const parentEl = anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : (anchor as HTMLElement);
    if (parentEl && (parentEl.isContentEditable || parentEl.closest("[contenteditable]"))) {
      source = "contenteditable";
      lastSavedElement = parentEl; // Lưu element contenteditable
    }
  }

  return { text, rect, source, node: anchor };
}

export function onSelectionChange(cb: SelectionCallback): void { listener = cb; }
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