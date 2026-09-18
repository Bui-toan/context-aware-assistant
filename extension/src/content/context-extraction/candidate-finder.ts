// =============================================================================
// candidate-finder.ts — Phase 4.1
// Từ node chứa selection, đi ngược lên cha để tìm các candidate block.
// Theo SDS §5.1.1.
// =============================================================================

import { PRIORITY_TAGS, type ContextCandidate } from "./types";

/**
 * Từ 1 node (thường là anchorNode của Selection), đi ngược lên DOM tree
 * để thu thập tất cả phần tử cha khớp với PRIORITY_TAGS.
 *
 * Trả về danh sách candidate sắp xếp theo khoảng cách:
 *   index 0 = gần selection nhất, index cuối = xa nhất.
 *
 * Trả về mảng rỗng nếu không tìm được candidate nào (node đứng ngoài document).
 */
export function findContextCandidates(selectionNode: Node): ContextCandidate[] {
  const candidates: ContextCandidate[] = [];
  let current: Node | null = selectionNode;
  let distance = 0;

  while (current && current !== document.documentElement) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      const priority = (PRIORITY_TAGS as readonly string[]).indexOf(tagName);

      if (priority !== -1) {
        candidates.push({
          element: el,
          tagName,
          priority,
          distance,
        });
      }
    }

    current = current.parentNode;
    distance++;
  }

  return candidates;
}

/**
 * Wrapper tiện dụng: nhận anchorNode, trả về candidate gần nhất
 * (chưa chấm điểm — dùng khi cần fallback nhanh).
 */
export function findNearestCandidate(selectionNode: Node): ContextCandidate | null {
  const candidates = findContextCandidates(selectionNode);
  return candidates[0] ?? null;
}