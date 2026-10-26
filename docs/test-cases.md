# TEST CASES — Context-Aware Reading & Writing Assistant

> Owner: Nguyễn Hoàng Phú (Track D)
> Cập nhật: mỗi cuối tuần.

## Quy ước

- **ID**: `TC-<phase>-<số>` (ví dụ `TC-02-01` = test case 1 của Phase 2)
- **Status**: ⏳ Chưa chạy | ✅ PASS | ❌ FAIL | 🚧 BLOCKED
- **Bug ticket**: ghi rõ ai đang fix nếu FAIL

---

## PHASE 2 — Extension Skeleton

| ID | Test case | Kỳ vọng | Status | Ghi chú |
|---|---|---|---|---|
| TC-02-01 | Load extension vào Chrome (`chrome://extensions` → Load unpacked → chọn `extension/dist`) | Card extension hiện, không lỗi manifest | ⏳ | |
| TC-02-02 | Bấm "Service Worker" trên card extension | Console hiện `[Service Worker] Loaded` | ⏳ | |
| TC-02-03 | Mở tab `https://example.com`, F12 Console | Hiện `[Content Script] Loaded on: https://example.com/` | ⏳ | |
| TC-02-04 | Bấm icon extension trên toolbar | Side Panel mở, hiện "Hello — Phase 2 OK" | ⏳ | |
| TC-02-05 | `cd extension && npm run build` | Exit 0, không lỗi TypeScript | ⏳ | |
| TC-02-06 | `grep -r ": any" extension/src/shared/` | Không có kết quả | ⏳ | |

---

## PHASE 3 — Selection Detection + Floating Action

| ID | Test case | Kỳ vọng | Status | Ghi chú |
|---|---|---|---|---|
| TC-03-01 | Bôi đen text thường trên example.com | Toolbar nổi hiện phía trên, đúng vị trí | ⏳ | |
| TC-03-02 | Bấm nút Explain trên toolbar | Content Script log: `Action: explain \| text: <đúng text>` | ⏳ | |
| TC-03-03 | Bấm nút Grammar | Content Script log `Action: grammar`, SW log `REQUEST_GRAMMAR` | ⏳ | |
| TC-03-04 | Bấm nút Rewrite | Content Script log `Action: rewrite`, SW log `REQUEST_REWRITE` | ⏳ | |
| TC-03-05 | Bôi đen text trong ô search Google | Toolbar hiện, bấm nút SW log đúng | ⏳ | |
| TC-03-06 | Bôi đen text trong `<textarea>` | Toolbar hiện | ⏳ | |
| TC-03-07 | Bôi đen text trong `<div contenteditable>` | Toolbar hiện | ⏳ | |
| TC-03-08 | Bỏ chọn (click chỗ trống) | Toolbar ẩn | ⏳ | |
| TC-03-09 | Bôi đen trên trang nhiều CSS phức tạp (vn express) | Toolbar hiện, không bị CSS trang ảnh hưởng | ⏳ | Shadow DOM cô lập |

---

## PHASE 4.1 + 4.2 — Context Extraction (Unit Test)

| ID | Test case | Kỳ vọng | Status | Ghi chú |
|---|---|---|---|---|
| TC-04-01 | `cd extension && npm test` | 13+ test PASS | ⏳ | Cả candidate-finder + block-scorer |
| TC-04-02 | `findContextCandidates` với `<p>` text node | Trả 1 candidate priority=0 | ⏳ | |
| TC-04-03 | `findContextCandidates` với article lồng p | Trả 2 candidate (p + article) | ⏳ | |
| TC-04-04 | `findContextCandidates` với orphan node | Trả [] | ⏳ | |
| TC-04-05 | `scoreCandidate` p vs div cùng text | p score > div score | ⏳ | |
| TC-04-06 | `scoreCandidate` block 200 chữ vs block 10000 chữ | Block 200 chữ score cao hơn | ⏳ | |
| TC-04-07 | `pickBestCandidate` với article > div > p | Trả về p | ⏳ | |

---

## PHASE 5.1 — Explain Service (Mock)

| ID | Test case | Kỳ vọng | Status | Ghi chú |
|---|---|---|---|---|
| TC-05-01 | `POST /api/explain` valid input | Status 200, body có 3 field `meaning/explanation/examples` | ⏳ | |
| TC-05-02 | `POST /api/explain` empty text | Status 400, `code=EMPTY_TEXT` | ⏳ | |
| TC-05-03 | `POST /api/explain` empty context | Status 200 (không lỗi) | ⏳ | |
| TC-05-04 | `POST /api/explain` invalid language | Status 422 (Pydantic validation) | ⏳ | |
| TC-05-05 | `POST /api/explain` context 10000 ký tự | Chạy OK hoặc 400 CONTEXT_TOO_LONG | ⏳ | Tùy impl |

---

## PHASE 5.2 (Real Provider) — sau khi có API key

*(để trống — điền khi tới Phase 5.2)*

---

## PHASE 6 (Explain E2E) — sau khi có Phase 5 + Phase 3

*(để trống)*

---

## TỔNG HỢP TUẦN 1

| Phase | Tổng TC | PASS | FAIL | BLOCKED |
|---|---|---|---|---|
| Phase 2 | 6 | 0 | 0 | 0 |
| Phase 3 | 9 | 0 | 0 | 0 |
| Phase 4 | 7 | 0 | 0 | 0 |
| Phase 5.1 | 5 | 0 | 0 | 0 |
| **Tổng** | **27** | **0** | **0** | **0** |

*Cập nhật cuối tuần 1.*