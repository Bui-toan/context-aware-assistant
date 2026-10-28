# PROGRESS — Context-Aware Reading & Writing Assistant

## Trạng thái hiện tại
- Phase đang làm: Phase 3 — Selection Detection + Floating Action
- Track đang làm: A (TV1)
- Trạng thái: Hoàn thành

## Đã hoàn thành
- Phase 0 (D): repo, .gitignore, PROGRESS.md
- Phase 1 (C): backend skeleton — /health và /api/health PASS, Postman 2 request PASS
- Phase 2 (A): extension skeleton — Vite + React + TS + Manifest V3, load Chrome PASS
- Phase 3 (A):
  - extension/src/content/selection-detector.ts — hỗ trợ window.getSelection + input + textarea + contenteditable
  - extension/src/content/floating-action.ts — toolbar Shadow DOM với 3 nút Explain/Grammar/Rewrite
  - extension/src/content/content-script.ts — wire detector + action + message bus
  - extension/src/background/service-worker.ts — nhận REQUEST_EXPLAIN/GRAMMAR/REWRITE, log payload
  - Test: 6 test case (text thường, input/textarea, contenteditable, bấm nút, bỏ chọn) PASS

## Đang dở
### Track A
- Không có

### Track B (TV2)
### Track B (TV2)
- ✅ Phase 4.1: `candidate-finder.ts` — tìm candidates theo PRIORITY_TAGS
- ✅ Phase 4.2: `block-scorer.ts` — chấm điểm heuristic (base + length + density + distance)
- ✅ Cài Vitest + jsdom cho testing
- ✅ 13 unit test PASS (7 candidate-finder + 6 block-scorer)
- ⏳ Phase 4.3 (sentence-context) — chờ tuần sau

### Track C (Phú)
- ✅ Phase 5.1: LLMProvider interface + MockProvider
- ✅ Phase 5.1: explain_service.py với build_prompt tách 4 phần
- ✅ Phase 5.1: route POST /api/explain + validate EMPTY_TEXT
- ✅ 3 Postman request PASS (valid, empty text, empty context)
- ⏳ Phase 5.2 (real provider) — chờ người dùng cấp API key

### Track D (TV4)
- Chưa setup Postman collection Phase 2-3

## Việc cần làm tiếp theo (theo đúng thứ tự)
### Track A (TV1 — BẠN)
1. Phase 6: Explain end-to-end (đợi TV3 xong Phase 5 mới làm được)

### Track B (TV2)
1. Phase 4.1: candidate-finder.ts
2. Phase 4.2: block-scorer.ts

### Track C (TV3)
1. Phase 5.1: llm_provider.py + explain_service.py (MockProvider)

### Track D (TV4)
1. Setup Postman collection
2. Viết docs/test-cases.md cho Phase 2-3

## THÔNG TIN CẦN NGƯỜI DÙNG CUNG CẤP ĐỂ CODE TIẾP
- [ ] Chưa cần gì cho Phase 3
- [ ] Cần trước Phase 5: chọn AI Provider + API Key
- [ ] Cần trước Phase 4: xác nhận giới hạn context (đề xuất 500 ký tự)
- [ ] Cần trước Phase 7: xác nhận số block tối đa (đề xuất 300)
- [ ] Cần trước Phase 11: xác nhận ngưỡng similarity (đề xuất 0.75)

## Quyết định đã chốt trong quá trình code
- Floating Action dùng Shadow DOM (mode: closed) — tránh CSS conflict với trang
- Toolbar tính vị trí bằng getBoundingClientRect + scroll offset
- Debounce selectionchange bằng requestAnimationFrame
- Content Script export {} cuối file để không bị tree-shake
- AI Provider: Google Gemini (Free tier). Model đọc từ biến môi trường GEMINI_MODEL.
- Giới hạn context: 500 ký tự (MAX_CONTEXT_LENGTH).
- Số block tối đa: 300 (MAX_BLOCKS).
- Ngưỡng similarity: 0.75 (SIMILARITY_THRESHOLD).
- API_BASE_URL của extension đọc từ Vite env (VITE_API_BASE_URL).
- Timeout AI đọc từ env (AI_TIMEOUT).

## Vấn đề/lỗi đang gặp
- Không có