# PROGRESS — Context-Aware Reading & Writing Assistant

## Trạng thái hiện tại
- Phase đang làm: Phase 1 — Backend skeleton
- Trạng thái: Hoàn thành

## Đã hoàn thành
- Phase 0: tạo cấu trúc thư mục, .gitignore, PROGRESS.md, git init + commit
- Phase 1:
  - backend/app/main.py — /health và /api/health chạy OK (test browser PASS)
  - backend/app/core/config.py — đọc .env OK
  - backend/app/schemas/{explain,search,grammar,rewrite,error}.py — đủ schema theo SDS mục 3.1/3.2
  - backend/requirements.txt — pin version đầy đủ
  - backend/.env.example + .env — có sẵn
  - backend/tests/postman/SDS_Nhom20.postman_collection.json — 2 request PASS
  - venv Python 3.12 tạo tại backend/.venv

## Đang dở
- Không có

## Việc cần làm tiếp theo (theo đúng thứ tự)
1. Sang Phase 2: Extension skeleton (manifest.json + Vite + React + TS)

## THÔNG TIN CẦN NGƯỜI DÙNG CUNG CẤP ĐỂ CODE TIẾP
- Không cần gì thêm, có thể code tiếp ngay Phase 2

## Quyết định đã chốt trong quá trình code
- Python 3.12 dùng cho backend (tạo venv bằng `py -3.12 -m venv .venv`)
- CORS đang mở `["*"]` cho MVP, sẽ siết ở Phase 14
- Error format chuẩn dùng class `ErrorResponse` trong `schemas/error.py`

## Vấn đề/lỗi đang gặp
- Không có