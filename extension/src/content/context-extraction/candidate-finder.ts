import { PRIORITY_TAGS, type ContextCandidate } from "./types";

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
        candidates.push({ element: el, tagName, priority, distance });
      }
    }
    current = current.parentNode;
    distance++;
  }
  return candidates;
}

// Thêm hàm này (bị thiếu ở bước trước)
export function findNearestCandidate(selectionNode: Node): ContextCandidate | null {
  const candidates = findContextCandidates(selectionNode);
  return candidates[0] ?? null;
}