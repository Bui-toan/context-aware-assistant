"""Tiện ích dùng chung cho các script test. Đặt cả bộ file này vào backend/tests/ và chạy từ thư mục đó."""
import difflib
import hashlib
import json
import os
import re
import subprocess
import time
import unicodedata
from datetime import datetime
from pathlib import Path

import requests

BASE = os.getenv("API_BASE", "http://localhost:8000/api").rstrip("/")
HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "data"        # data test (sinh bằng gen_testdata.py)
RESULTS_DIR = HERE / "results"  # toàn bộ kết quả chạy test được lưu ở đây
GOLD_DIR = HERE / "gold"        # đáp án chuẩn do NGƯỜI soạn và duyệt (không sinh bằng code)
DATA_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

VI_CHARS = set("àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ")


def vi_ratio(text: str) -> float:
    """Tỉ lệ ký tự có dấu tiếng Việt trên tổng số chữ cái (VI thường > 0.08, EN gần 0)."""
    letters = [c for c in text.lower() if c.isalpha()]
    return sum(c in VI_CHARS for c in letters) / len(letters) if letters else 0.0


def norm(t: str) -> str:
    t = unicodedata.normalize("NFC", t or "").lower().strip()
    t = t.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')  # thống nhất dấu nháy kiểu chữ in
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

SECRET_TOKEN = os.getenv("EXTENSION_TOKEN", "CAA_NHOM20_SECRET_2026")

def call(endpoint: str, payload: dict, retries: int = 2, backoff: float = 10.0) -> dict:
    """POST tới backend. Tự thử lại khi gặp 429/503/AI_PROVIDER_ERROR (hết quota tạm thời)."""
    url = f"{BASE}/{endpoint}"
    out = {}
    
    # Thêm Headers chứa Token bảo mật vào đây
    headers = {
        "Content-Type": "application/json",
        "X-Extension-Token": SECRET_TOKEN
    }
    
    for attempt in range(retries + 1):
        t0 = time.time()
        try:
            # Truyền headers=headers vào request
            r = requests.post(url, json=payload, headers=headers, timeout=120)
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


# ------------------------------------------------------------------ nguồn gốc và độ tin cậy của đáp án
def sha256_file(p) -> str:
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def git_commit():
    try:
        out = subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True, cwd=HERE, timeout=5)
        return out.stdout.strip() or None
    except Exception:
        return None


def has_term(text: str, term) -> bool:
    """Có từ/cụm từ trong văn bản (không phân biệt hoa thường, theo ranh giới từ). term là list = có MỘT trong các từ đồng nghĩa."""
    if isinstance(term, (list, tuple)):
        return any(has_term(text, t) for t in term)
    t = unicodedata.normalize("NFC", term).lower()
    s = unicodedata.normalize("NFC", text or "").lower()
    return re.search(r"(?<!\w)" + re.escape(t) + r"(?!\w)", s) is not None


def first_rank(ids, relevant):
    """Hạng (bắt đầu từ 1) của kết quả đúng đầu tiên trong danh sách; None nếu không có."""
    for i, x in enumerate(ids, 1):
        if x in relevant:
            return i
    return None


def load_gold(name: str):
    p = GOLD_DIR / name
    if not p.exists():
        raise SystemExit(f"Chưa có {p}")
    d = json.loads(p.read_text(encoding="utf-8"))
    return d, d["cases"]


def _verify(manifest_path: Path, base: Path):
    m = json.loads(manifest_path.read_text(encoding="utf-8"))
    bad = [n for n, h in m["files"].items() if not (base / n).exists() or sha256_file(base / n) != h]
    return m, bad


def gold_status() -> dict:
    """DRAFT = chưa ai duyệt | APPROVED = đã duyệt và khóa bằng SHA-256 | TAMPERED = bị sửa sau khi duyệt."""
    mp = GOLD_DIR / "GOLD_MANIFEST.json"
    if not mp.exists():
        return {"state": "DRAFT", "detail": "Đáp án chuẩn CHƯA được người duyệt và chốt (python gold_tool.py freeze)."}
    m, bad = _verify(mp, GOLD_DIR)
    if bad:
        return {"state": "TAMPERED", "detail": f"File gold đã bị sửa sau khi chốt: {bad}"}
    return {"state": "APPROVED", "reviewers": m.get("reviewers"), "approved_at": m.get("approved_at"), "cases": m.get("cases")}


def data_status() -> dict:
    """GENERATED = đúng như lúc sinh | MODIFIED = bị sửa tay | UNKNOWN = không rõ nguồn gốc."""
    mp = DATA_DIR / "MANIFEST.json"
    if not mp.exists():
        return {"state": "UNKNOWN", "detail": "Không có data/MANIFEST.json (không rõ nguồn gốc data)."}
    m, bad = _verify(mp, DATA_DIR)
    if bad:
        return {"state": "MODIFIED", "detail": f"Data bị sửa sau khi sinh: {bad}"}
    return {"state": "GENERATED", "seed": m.get("seed"), "generated_at": m.get("generated_at"),
            "testbank_sha256": str(m.get("testbank_sha256", ""))[:12]}


def write_data_manifest(seed: int, extra: dict | None = None):
    files = {p.name: sha256_file(p) for p in sorted(DATA_DIR.glob("*.json")) if p.name != "MANIFEST.json"}
    m = {"seed": seed, "generated_at": now(), "testbank_sha256": sha256_file(HERE / "testbank.py"),
         "generator_sha256": sha256_file(HERE / "gen_testdata.py"), "files": files, **(extra or {})}
    save_json(DATA_DIR / "MANIFEST.json", m)


# ------------------------------------------------------------------ thống kê trung thực và dấu vân tay phiên bản
def wilson(k: int, n: int, z: float = 1.96):
    """Khoảng tin cậy 95% (Wilson) cho tỉ lệ k/n. Mẫu nhỏ thì khoảng rất rộng, đó là sự thật cần được nhìn thấy."""
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / d
    half = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5) / d
    return (max(0.0, centre - half), min(1.0, centre + half))


def ci_text(k: int, n: int) -> str:
    if not n:
        return "n/a"
    lo, hi = wilson(k, n)
    return f"{k / n:.1%} ({k}/{n}; KTC95% {lo:.0%}–{hi:.0%})"


def backend_model():
    """Tên model Gemini backend đang dùng: biến môi trường GEMINI_MODEL, hoặc dòng GEMINI_MODEL trong backend/.env (không đọc khóa API)."""
    m = os.getenv("GEMINI_MODEL")
    if m:
        return m
    try:
        for line in (HERE.parent / ".env").read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("GEMINI_MODEL"):
                return line.split("=", 1)[1].strip().strip('"').strip("'") or None
    except OSError:
        pass
    return None


def prompt_fingerprint():
    """Dấu vân tay các file prompt trong backend/app (tên file chứa 'prompt'); hoặc biến môi trường PROMPT_VERSION nếu đặt."""
    root = HERE.parent / "app"
    files = sorted(p for p in root.rglob("*") if p.is_file() and "prompt" in p.name.lower()
                   and p.suffix in (".py", ".txt", ".md", ".json", ".yaml", ".yml")) if root.exists() else []
    if files:
        h = hashlib.sha256()
        for p in files:
            h.update(p.read_bytes())
        return h.hexdigest()[:12]
    return os.getenv("PROMPT_VERSION")