# PROGRESS — Context-Aware Reading & Writing Assistant

## Trạng thái hiện tại
- Phase đang làm: Phase 2 — Extension skeleton
- Track đang làm: A (TV1)
- Trạng thái: Hoàn thành

## Đã hoàn thành
- Phase 0 (D): repo, .gitignore, PROGRESS.md
- Phase 1 (C): backend skeleton — /health và /api/health chạy OK, Postman collection 2 request PASS
- Phase 2 (A):
  - extension/manifest.json — Manifest V3, permissions: storage/sidePanel/activeTab/scripting
  - extension/package.json — React 18 + Vite 5 + @crxjs/vite-plugin 2.0.0-beta
  - extension/tsconfig.json — strict mode, types: chrome + vite/client
  - extension/vite.config.ts — @crxjs plugin + react plugin
  - extension/index.html — entry cho Side Panel
  - extension/src/background/service-worker.ts — setPanelBehavior + log
  - extension/src/content/content-script.ts — log
  - extension/src/shared/messaging/types.ts — ĐẦY ĐỦ 11 MessageType + payload interfaces
  - extension/src/shared/api/types.ts — mirror 1:1 schema backend Phase 1
  - extension/src/shared/messaging/message-bus.ts — sendMessage, onMessage, sendTabMessage, newRequestId
  - extension/src/sidepanel/{index.tsx, App.tsx} — hiển thị "Hello — Phase 2 OK"
  - Test: load Chrome PASS, Service Worker log PASS, Content Script log PASS, Side Panel mở PASS

## Đang dở
### Track A
- Không có

### Track B (TV2) — chưa bắt đầu
- Đang chờ bắt đầu Phase 4.1: candidate-finder.ts

### Track C (TV3) — chưa bắt đầu
- Đang chờ bắt đầu Phase 5.1: llm_provider.py + explain_service.py (MockProvider)

### Track D (TV4) — chưa bắt đầu
- Đang chờ setup Postman collection Phase 2

## Việc cần làm tiếp theo (theo đúng thứ tự)
### Track A (TV1 — BẠN)
1. Phase 3: Selection Detection + Floating Action

### Track B (TV2)
1. Phase 4.1: candidate-finder.ts
2. Phase 4.2: block-scorer.ts

### Track C (TV3)
1. Phase 5.1: llm_provider.py + explain_service.py

### Track D (TV4)
1. Setup Postman collection + test cases Phase 2-4

## THÔNG TIN CẦN NGƯỜI DÙNG CUNG CẤP ĐỂ CODE TIẾP
- [ ] Chưa cần gì cho Phase 3
- [ ] Cần cho Phase 4: xác nhận giới hạn context (đề xuất 500 ký tự)
- [ ] Cần cho Phase 5: chọn AI Provider + API Key
- [ ] Cần cho Phase 7: xác nhận số block tối đa (đề xuất 300)
- [ ] Cần cho Phase 11: xác nhận ngưỡng similarity (đề xuất 0.75)

## Quyết định đã chốt trong quá trình code
- @crxjs/vite-plugin dùng version 2.0.0-beta.23
- Vite 5.4.0, React 18.3.1, TypeScript 5.5.4
- Side Panel mở qua action click (chrome.sidePanel.setPanelBehavior)
- host_permissions MVP chỉ localhost:8000 (đổi khi deploy)

## Vấn đề/lỗi đang gặp
- Không có