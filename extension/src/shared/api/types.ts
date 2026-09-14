// =============================================================================
// API types — mirror 1:1 với backend/app/schemas/*.py
// Nếu backend đổi field, file này PHẢI đổi theo (và ngược lại).
// =============================================================================

import type { Language, RewriteMode } from "../messaging/types";

// ===== /api/explain =====
export interface ExplainRequest {
  text: string;
  context: string;
  language: Language;
}

export interface ExplainResponse {
  meaning: string;
  explanation: string;
  examples: string[];
}

// ===== /api/search =====
export interface Chunk {
  chunkId: string;
  text: string;
}

export interface SearchRequest {
  query: string;
  chunks: Chunk[];
  topK?: number;
}

export interface SearchResultItem {
  chunkId: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResultItem[];
}

// ===== /api/grammar =====
export interface GrammarRequest {
  text: string;
  context: string;
  language: Language;
}

export interface GrammarError {
  type: string;
  explanation: string;
}

export interface GrammarResponse {
  original: string;
  suggested: string;
  errors: GrammarError[];
}

// ===== /api/rewrite =====
export interface RewriteRequest {
  text: string;
  context: string;
  mode: RewriteMode;
  language: Language;
}

export interface VerificationInfo {
  semanticSimilarity: number;
  lengthChangePercent: number;
  compressionRatio: number | null;
}

export interface RewriteResponse {
  rewritten: string;
  verification: VerificationInfo;
}

// ===== Lỗi chung =====
export type ApiErrorCode =
  | "EMPTY_TEXT"
  | "CONTEXT_TOO_LONG"
  | "INVALID_MODE"
  | "AI_TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}