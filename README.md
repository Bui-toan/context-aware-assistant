# Context-Aware Reading & Writing Assistant

## 1. Yêu cầu hệ thống
- Node.js >= 18
- Python >= 3.11
- Google Chrome

## 2. Cài đặt Backend
1. `cd backend`
2. `python -m venv .venv`
3. Kích hoạt venv: `.\.venv\Scripts\activate` (Windows)
4. `pip install -r requirements.txt`
5. Tạo file `.env` từ `.env.example` và điền `GEMINI_API_KEY`.
6. Chạy: `uvicorn app.main:app --reload`

## 3. Cài đặt Extension
1. `cd extension`
2. `npm install`
3. `npm run build`
4. Mở Chrome -> `chrome://extensions` -> Bật Developer Mode.
5. Chọn "Load unpacked" -> Trỏ tới thư mục `extension/dist`.

## 4. Hướng dẫn sử dụng
- Mở Side Panel của Extension để xem kết quả.
- Bôi đen văn bản trên trang web để hiện thanh công cụ (Explain, Grammar, Rewrite).
- Chuyển sang tab Search để tìm kiếm ngữ nghĩa trên toàn bộ trang.