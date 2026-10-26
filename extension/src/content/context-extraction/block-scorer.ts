import type { ContextCandidate, ScoredCandidate } from "./types";

const BASE_SCORE_BY_PRIORITY = [100, 90, 85, 80, 80, 70, 60, 40];

export function scoreCandidate(candidate: ContextCandidate): number {
  let score = BASE_SCORE_BY_PRIORITY[candidate.priority] ?? 30;
  const text = (candidate.element.textContent ?? "").trim();
  
  if (text.length < 20) score -= 20;
  else if (text.length <= 1000) score += 20;
  else if (text.length <= 3000) score += 5;
  else score -= 30;

  const htmlLength = candidate.element.innerHTML.length;
  if (htmlLength > 0) {
    score += Math.min((text.length / htmlLength) * 20, 20);
  }

  return score + Math.max(10 - candidate.distance * 5, 0);
}

// Thêm hàm này (bị thiếu ở bước trước)
export function scoreAllCandidates(candidates: ContextCandidate[]): ScoredCandidate[] {
  return candidates
    .map((c) => ({ ...c, score: scoreCandidate(c) }))
    .sort((a, b) => b.score - a.score);
}

export function pickBestCandidate(candidates: ContextCandidate[]): ScoredCandidate | null {
  const scored = scoreAllCandidates(candidates);
  return scored[0] ?? null;
}