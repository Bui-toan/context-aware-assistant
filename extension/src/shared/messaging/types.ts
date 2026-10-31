// =============================================================================
// Message Passing types — hợp đồng cứng theo SDS §5.7
// =============================================================================
// QUY TẮC:
// - KHÔNG truyền DOM Element, DOM Range, Function, Event Object qua message.
// - Chỉ String / Number / Boolean / Array / Object thuần.
// - Mọi request PHẢI có requestId (crypto.randomUUID()).
// =============================================================================

export type MessageType =
  | "SELECTION_DETECTED"
  | "REQUEST_EXPLAIN"
  | "REQUEST_SEARCH"
  | "REQUEST_GRAMMAR"
  | "REQUEST_REWRITE"
  | "RESULT_READY"
  | "ERROR"
  | "APPLY_SUGGESTION"
  | "HIGHLIGHT_CHUNK"
  | "GET_PAGE_CHUNKS"
  | "PAGE_CHUNKS_READY";

export type Language = "vi" | "en";
export type RewriteMode = "formal" | "casual" | "academic" | "shorten" | "improve";

export interface BaseMessage {
  type: MessageType;
  requestId: string;
  payload: unknown;
}

// =============================================================================
// Payload interfaces — một interface cho mỗi MessageType
// =============================================================================

export interface SelectionDetectedPayload {
  text: string;
  context: string;
  language: Language;
}

export interface ExplainRequestPayload {
  text: string;
  context: string;
  language: Language;
}

export interface SearchRequestPayload {
  query: string;
  topK?: number;
}

export interface GrammarRequestPayload {
  text: string;
  context: string;
  language: Language;
}

export interface RewriteRequestPayload {
  text: string;
  context: string;
  mode: RewriteMode;
  language: Language;
}

export interface ResultReadyPayload {
  actionType: "explain" | "search" | "grammar" | "rewrite";
  data: unknown;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface ApplySuggestionPayload {
  original: string;
  suggested: string;
}

export interface HighlightChunkPayload {
  chunkId: string;
}

export interface PageChunksReadyPayload {
  chunks: Array<{ chunkId: string; text: string }>;
}

// =============================================================================
// Typed messages — dùng khi cần type-safe ở từng chỗ
// =============================================================================

export interface SelectionDetectedMessage extends BaseMessage {
  type: "SELECTION_DETECTED";
  payload: SelectionDetectedPayload;
}

export interface RequestExplainMessage extends BaseMessage {
  type: "REQUEST_EXPLAIN";
  payload: ExplainRequestPayload;
}

export interface RequestSearchMessage extends BaseMessage {
  type: "REQUEST_SEARCH";
  payload: SearchRequestPayload;
}

export interface RequestGrammarMessage extends BaseMessage {
  type: "REQUEST_GRAMMAR";
  payload: GrammarRequestPayload;
}

export interface RequestRewriteMessage extends BaseMessage {
  type: "REQUEST_REWRITE";
  payload: RewriteRequestPayload;
}

export interface ResultReadyMessage extends BaseMessage {
  type: "RESULT_READY";
  payload: ResultReadyPayload;
}

export interface ErrorMessage extends BaseMessage {
  type: "ERROR";
  payload: ErrorPayload;
}

export interface ApplySuggestionMessage extends BaseMessage {
  type: "APPLY_SUGGESTION";
  payload: ApplySuggestionPayload;
}

export interface HighlightChunkMessage extends BaseMessage {
  type: "HIGHLIGHT_CHUNK";
  payload: HighlightChunkPayload;
}

export interface GetPageChunksMessage extends BaseMessage {
  type: "GET_PAGE_CHUNKS";
  payload: Record<string, never>;
}

export interface PageChunksReadyMessage extends BaseMessage {
  type: "PAGE_CHUNKS_READY";
  payload: PageChunksReadyPayload;
}

export interface SearchRequestPayload {
  query: string;
  topK?: number;
  chunks?: Array<{ chunkId: string; text: string }>; // PDF và Google Docs: Side Panel tự lấy rồi gửi kèm
}

export type AppMessage =
  | SelectionDetectedMessage
  | RequestExplainMessage
  | RequestSearchMessage
  | RequestGrammarMessage
  | RequestRewriteMessage
  | ResultReadyMessage
  | ErrorMessage
  | ApplySuggestionMessage
  | HighlightChunkMessage
  | GetPageChunksMessage
  | PageChunksReadyMessage;