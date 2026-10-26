import { findContextCandidates } from "./candidate-finder";
import { pickBestCandidate } from "./block-scorer";
import { getSentenceContext } from "./sentence-context";
import { limitContext } from "./context-limiter";
import { fallbackContext } from "./fallback";

export function extractContext(selectionNode: Node | null, selectionText: string): string {
  try {
    if (!selectionNode) return fallbackContext(selectionText);

    const candidates = findContextCandidates(selectionNode);
    const best = pickBestCandidate(candidates);
    
    if (!best) return fallbackContext(selectionText);

    const blockText = best.element.textContent || "";
    const rawContext = getSentenceContext(blockText, selectionText);
    
    // Đọc MAX_CONTEXT_LENGTH từ config (mặc định 500)
    return limitContext(rawContext, 500);
  } catch (error) {
    console.error("[Context Extraction] Lỗi:", error);
    return fallbackContext(selectionText);
  }
}