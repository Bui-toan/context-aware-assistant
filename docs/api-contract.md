3.1. REST API Contracts (Backend)
Base URL (dev): http://localhost:8000/api
POST /api/explain
// Request
{
  "text": "string",          // đoạn được chọn (selection)
  "context": "string",       // câu trước + câu chứa + câu sau (đã build ở Phase 4)
  "language": "vi" | "en"    // ngôn ngữ mong muốn trả lời
}
// Response 200
{
  "meaning": "string",
  "explanation": "string",
  "examples": ["string", "string"]
}
// Response lỗi: xem mục 3.3
POST /api/search
// Request
{
  "query": "string",
  "chunks": [
    { "chunkId": "string", "text": "string" }
  ],
  "topK": 5   // optional, mặc định 5 (SDS §5.3.5)
}
// Response 200
{
  "results": [
    { "chunkId": "string", "score": 0.87 }
  ]
}
POST /api/grammar
// Request
{ "text": "string", "context": "string", "language": "vi" | "en" }
// Response 200
{
  "original": "string",
  "suggested": "string",
  "errors": [
    { "type": "string", "explanation": "string" }
  ]
}
POST /api/rewrite
// Request
{
  "text": "string",
  "context": "string",
  "mode": "formal" | "casual" | "academic" | "shorten" | "improve",
  "language": "vi" | "en"
}
// Response 200
{
  "rewritten": "string",
  "verification": {
    "semanticSimilarity": 0.91,
    "lengthChangePercent": -12.5,
    "compressionRatio": 0.87   // chỉ có giá trị khi mode = "shorten", ngược lại null
  }
}
3.2. Format lỗi chung (mọi endpoint)
// Response 4xx/5xx
{
  "error": {
    "code": "EMPTY_TEXT" | "CONTEXT_TOO_LONG" | "INVALID_MODE" | "AI_TIMEOUT" | "AI_PROVIDER_ERROR" | "INTERNAL_ERROR",
    "message": "string (human-readable, để hiển thị lên UI)"
  }
}
3.3. Message Passing nội bộ Extension (Content Script ↔ Service Worker ↔ Side Panel)
Định nghĩa trong extension/src/shared/messaging/types.ts:
type MessageType =
  | "SELECTION_DETECTED"      // Content Script -> Service Worker
  | "REQUEST_EXPLAIN"         // Content Script -> Service Worker
  | "REQUEST_SEARCH"          // Side Panel -> Service Worker
  | "REQUEST_GRAMMAR"         // Content Script -> Service Worker
  | "REQUEST_REWRITE"         // Content Script -> Service Worker
  | "RESULT_READY"            // Service Worker -> Side Panel / Content Script
  | "ERROR"                   // Service Worker -> bất kỳ
  | "APPLY_SUGGESTION"        // Side Panel -> Content Script (Accept)
  | "HIGHLIGHT_CHUNK"         // Side Panel -> Content Script (khi click 1 kết quả search)
  | "GET_PAGE_CHUNKS"         // Service Worker -> Content Script (yêu cầu quét trang cho Semantic Search)
  | "PAGE_CHUNKS_READY";      // Content Script -> Service Worker

interface BaseMessage {
  type: MessageType;
  requestId: string;   // BẮT BUỘC — theo SDS §5.7, dùng để ghép response đúng request
  payload: unknown;    // tuỳ loại message, xem các interface con
}
Quy tắc cứng (theo SDS §5.7 — không được vi phạm):
•	KHÔNG BAO GIỜ truyền DOM Element, DOM Range, Function, Event Object qua message. Chỉ String/Number/Boolean/Array/Object thuần.
•	Mọi request phải có requestId (dùng crypto.randomUUID()), response phải trả lại đúng requestId đó.
•	DOM reference (con trỏ tới phần tử) chỉ được giữ ở Content Script; nếu Side Panel cần "trỏ" tới 1 đoạn text, dùng chunkId (string) chứ không dùng DOM reference.
