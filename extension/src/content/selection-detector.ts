// =============================================================================
// Selection Detector — phát hiện văn bản được chọn trên trang.
// Hỗ trợ: text thường, input, textarea, contenteditable.
// Theo SDS §3.2 (FR-01) và mục 5.1.
// =============================================================================

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

/**
 * Lấy selection hiện tại. Trả về null nếu không có gì được chọn.
 */
export function getCurrentSelection(): SelectionInfo | null {
  // ---- Case 1: input / textarea đang focus và có selection nội bộ ----
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
          return {
            text,
            rect: el.getBoundingClientRect(),
            source: tag === "input" ? "input" : "textarea",
            node: el, // <--- ĐÃ THÊM NODE VÀO ĐÂY (Trả về chính thẻ input/textarea)
          };
        }
      }
    }
  }

  // ---- Case 2: window.getSelection (văn bản thường + contenteditable) ----
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

  const text = sel.toString().trim();
  if (!text) return null;

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Xác định source: nếu anchor nằm trong contenteditable → contenteditable
  let source: SelectionSource = "window";
  const anchor = sel.anchorNode;
  if (anchor) {
    const parentEl =
      anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : (anchor as HTMLElement);
    if (parentEl && (parentEl.isContentEditable || parentEl.closest("[contenteditable]"))) {
      source = "contenteditable";
    }
  }

  return { 
    text, 
    rect, 
    source,
    node: anchor // <--- ĐÃ THÊM NODE VÀO ĐÂY (Trả về node bắt đầu bôi đen)
  };
}

/**
 * Đăng ký callback khi selection thay đổi.
 */
export function onSelectionChange(cb: SelectionCallback): void {
  listener = cb;
}

/**
 * Bắt đầu lắng nghe selection thay đổi trên toàn trang.
 */
export function startSelectionDetection(): void {
  document.addEventListener("mouseup", handleChange, true);
  document.addEventListener("keyup", handleChange, true);
  document.addEventListener("selectionchange", handleChange, true);
}

/**
 * Dừng lắng nghe.
 */
export function stopSelectionDetection(): void {
  document.removeEventListener("mouseup", handleChange, true);
  document.removeEventListener("keyup", handleChange, true);
  document.removeEventListener("selectionchange", handleChange, true);
}

/**
 * Debounce bằng requestAnimationFrame — tránh gọi handler quá nhiều lần.
 */
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