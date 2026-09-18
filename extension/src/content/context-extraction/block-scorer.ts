// =============================================================================
// block-scorer.ts — Phase 4.2
// Chấm điểm candidate dựa trên SDS §5.1.2:
//   - Loại phần tử
//   - Chiều dài nội dung
//   - Mật độ văn bản (text/html ratio)
//   - Khoảng cách tới selection
// Phương pháp: heuristic thuần túy, KHÔNG dùng Machine Learning.
// =============================================================================

import type { ContextCandidate, ScoredCandidate } from "./types";

// Điểm cơ bản theo priority — SDS §5.1.1
// priority 0 (p) = 100 điểm, giảm dần theo mức độ ưu tiên
const BASE_SCORE_BY_PRIORITY = [100, 90, 85, 80, 80, 70, 60, 40];

// Ngưỡng độ dài
const MIN_TEXT_LENGTH = 20;       // dưới ngưỡng này = quá ngắn
const IDEAL_MAX_LENGTH = 1000;    // lý tưởng
const HARD_MAX_LENGTH = 3000;     // trên ngưỡng này = quá dài, giảm điểm

/**
 * Tính điểm cho 1 candidate.
 * Công thức gồm 4 phần: base + length + density + distance bonus.
 */
export function scoreCandidate(candidate: ContextCandidate): number {
  // ---- 1. Base score theo loại phần tử ----
  let score = BASE_SCORE_BY_PRIORITY[candidate.priority] ?? 30;

  // ---- 2. Điểm theo độ dài text ----
  const text = (candidate.element.textContent ?? "").trim();
  const textLength = text.length;

  if (textLength < MIN_TEXT_LENGTH) {
    score -= 20; // quá ngắn
  } else if (textLength <= IDEAL_MAX_LENGTH) {
    score += 20; // lý tưởng
  } else if (textLength <= HARD_MAX_LENGTH) {
    score += 5; // chấp nhận được
  } else {
    score -= 30; // quá dài — SDS yêu cầu "block quá dài bị giảm điểm"
  }

  // ---- 3. Điểm theo mật độ văn bản (text / html) ----
  // Block lồng nhiều thẻ con (iframe, img, script, ...) → mật độ thấp → ít liên quan
  const htmlLength = candidate.element.innerHTML.length;
  if (htmlLength > 0) {
    const density = textLength / htmlLength; // 0..1
    score += Math.min(density * 20, 20);     // max +20
  }

  // ---- 4. Điểm theo khoảng cách tới selection ----
  // Cha gần selection luôn ưu tiên hơn (theo SDS §5.1.1)
  // distance 0 → +10, distance 1 → +5, distance 2 → +2, xa hơn → 0
  const distanceBonus = Math.max(10 - candidate.distance * 5, 0);
  score += distanceBonus;

  return score;
}

/**
 * Chấm điểm tất cả candidate, trả về mảng đã sắp xếp giảm dần theo score.
 */
export function scoreAllCandidates(candidates: ContextCandidate[]): ScoredCandidate[] {
  return candidates
    .map((c) => ({ ...c, score: scoreCandidate(c) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Từ danh sách candidate, trả về best candidate (score cao nhất).
 * Trả về null nếu danh sách rỗng.
 */
export function pickBestCandidate(candidates: ContextCandidate[]): ScoredCandidate | null {
  const scored = scoreAllCandidates(candidates);
  return scored[0] ?? null;
}