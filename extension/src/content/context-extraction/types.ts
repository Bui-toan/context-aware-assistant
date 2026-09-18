// =============================================================================
// Types cho Context Extraction Engine — theo SDS §5.1
// =============================================================================

/**
 * Thứ tự ưu tiên phần tử cha — SDS §5.1.1
 * Index nhỏ hơn = ưu tiên cao hơn.
 */
export const PRIORITY_TAGS = [
  "p",           // 0 — Paragraph (ưu tiên cao nhất)
  "li",          // 1 — List Item
  "blockquote",  // 2 — Blockquote
  "td",          // 3 — Table Cell
  "th",          // 3 — Table Header (cùng mức)
  "article",     // 4 — Article
  "section",     // 5 — Section
  "div",         // 6 — Div (fallback cuối cùng)
] as const;

export type PriorityTag = (typeof PRIORITY_TAGS)[number];

/**
 * 1 candidate block tìm được từ việc đi ngược lên cha.
 */
export interface ContextCandidate {
  /** Phần tử DOM */
  element: HTMLElement;
  /** Tên tag viết thường */
  tagName: string;
  /** Index trong PRIORITY_TAGS (0 = ưu tiên cao nhất) */
  priority: number;
  /** Khoảng cách tới selection: 0 = cha gần nhất, 1 = ông, ... */
  distance: number;
}

/**
 * Candidate đã được chấm điểm.
 */
export interface ScoredCandidate extends ContextCandidate {
  /** Điểm số — cao hơn = phù hợp hơn */
  score: number;
}