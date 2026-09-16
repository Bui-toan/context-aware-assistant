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
- Chưa bắt đầu Phase 4.1

### Track C (TV3)
- Chưa bắt đầu Phase 5.1

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

## Vấn đề/lỗi đang gặp
- Không có