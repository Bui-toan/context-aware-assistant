"""Tiện ích dùng chung cho các script test. Đặt cả bộ file này vào backend/tests/ và chạy từ thư mục đó."""
import difflib
import json
import os
import re
import time
import unicodedata
from datetime import datetime
from pathlib import Path

import requests

BASE = os.getenv("API_BASE", "http://localhost:8000/api").rstrip("/")
HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "data"        # data test (sinh bằng gen_testdata.py)
RESULTS_DIR = HERE / "results"  # toàn bộ kết quả chạy test được lưu ở đây
DATA_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

VI_CHARS = set("àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ")


def vi_ratio(text: str) -> float:
    """Tỉ lệ ký tự có dấu tiếng Việt trên tổng số chữ cái (VI thường > 0.08, EN gần 0)."""
    letters = [c for c in text.lower() if c.isalpha()]
    return sum(c in VI_CHARS for c in letters) / len(letters) if letters else 0.0


def norm(t: str) -> str:
    t = unicodedata.normalize("NFC", t or "").lower().strip()
    return re.sub(r"\s+", " ", t).rstrip(".!? ")


def sim(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def err_code(body) -> str | None:
    """Lấy mã lỗi dù backend trả {"error":{...}} (đúng hợp đồng) hay {"detail":{...}} (mặc định FastAPI)."""
    if not isinstance(body, dict):
        return None
    for key in ("error", "detail"):
        v = body.get(key)
        if isinstance(v, dict) and "code" in v:
            return v["code"]
    return None


def call(endpoint: str, payload: dict, retries: int = 2, backoff: float = 10.0) -> dict:
    """POST tới backend. Tự thử lại khi gặp 429/503/AI_PROVIDER_ERROR (hết quota tạm thời)."""
    url = f"{BASE}/{endpoint}"
    out = {}
    for attempt in range(retries + 1):
        t0 = time.time()
        try:
            r = requests.post(url, json=payload, timeout=120)
            try:
                body = r.json()
            except ValueError:
                body = {"_raw": r.text[:300]}
            out = {"status": r.status_code, "body": body, "time": round(time.time() - t0, 3)}
        except requests.RequestException as e:
            out = {"status": 0, "body": {"_exception": str(e)}, "time": round(time.time() - t0, 3)}
        transient = out["status"] in (429, 503) or err_code(out["body"]) == "AI_PROVIDER_ERROR"
        if not transient or attempt == retries:
            break
        time.sleep(backoff * (attempt + 1))
    out["retries"] = attempt
    return out


def load_json(name: str):
    p = DATA_DIR / name
    if not p.exists():
        raise SystemExit(f"Chưa có {p}. Chạy trước: python gen_testdata.py")
    return json.loads(p.read_text(encoding="utf-8"))


def load_jsonl(p: Path):
    if not p.exists():
        return []
    return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]


def append_jsonl(p: Path, obj: dict):
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def save_json(p: Path, obj):
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def ensure_backend():
    """Dừng sớm với thông báo rõ ràng nếu backend chưa chạy (tránh ghi hàng loạt kết quả lỗi)."""
    root = BASE[:-4] if BASE.endswith("/api") else BASE
    try:
        requests.get(root + "/docs", timeout=5)
    except requests.RequestException:
        raise SystemExit(f"❌ Không kết nối được backend tại {BASE}. Hãy chạy 'uvicorn app.main:app --reload' trong thư mục backend "
                         f"(hoặc đặt biến môi trường API_BASE) rồi thử lại.")