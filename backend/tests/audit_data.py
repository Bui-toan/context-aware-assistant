"""KIỂM TOÁN data sinh tự động: kiểm tra từng ca có thật sự đúng với ĐỊNH NGHĨA của nó hay không.
  python audit_data.py          (chạy sau gen_testdata.py; thoát mã 1 nếu có ca sai)
Ý tưởng: không tin bộ sinh. Với mỗi ca, kiểm tra các tính chất bất biến bằng cách viết độc lập với code sinh.
  - Search : đúng 1 đoạn 'target', không trùng lặp, target và truy vấn thuộc CÙNG một chủ đề trong testbank
  - Grammar: lỗi chèn vào đúng như mô tả (mất dấu, đảo chữ, lặp từ, dính từ, chia động từ, thiếu mạo từ)
  - Khác   : id không trùng, trường bắt buộc đầy đủ, nhãn cặp câu hợp lệ, độ dài các ca biên đúng như ghi chú
Kết quả: results/audit_report.json
"""
import sys
import unicodedata
from collections import Counter, defaultdict

from common import RESULTS_DIR, data_status, load_json, now, save_json, vi_ratio
from testbank import EN_TERMS, T

SENT = {s for t in T for s in (t[1], t[2])}
QUERY_TOPIC = {q: i for i, t in enumerate(T) for q in (t[3], t[4], t[5])}
TEXT_TOPIC = {s: i for i, t in enumerate(T) for s in (t[1], t[2])}
ARTICLES = {"the", "a", "an"}
VERB_PAIRS = {("is", "are"), ("are", "is"), ("was", "were"), ("were", "was"), ("has", "have")}


def fold(s):
    nd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nd if unicodedata.category(c) != "Mn").replace("đ", "d").replace("Đ", "D")


def grammar_ok(c):
    t, e, kind = c["text"], c["expected"], c["error_type"]
    tw, ew = t.split(), e.split()
    if e not in SENT:
        return "câu đúng không nằm trong testbank (nguồn không được người soạn)"
    if kind == "không có lỗi":
        return None if t == e else "ca 'không có lỗi' nhưng text khác expected"
    if t == e:
        return "ca có lỗi nhưng text trùng expected"
    if kind == "mất dấu tiếng Việt":
        return None if (vi_ratio(t) == 0 and fold(e) == t and len(e) == len(t)) else "không phải bản bỏ dấu của câu đúng"
    if kind == "lỗi chính tả (đảo chữ)":
        diff = [i for i in range(min(len(t), len(e))) if t[i] != e[i]]
        ok = len(t) == len(e) and Counter(t) == Counter(e) and len(diff) == 2 and diff[1] == diff[0] + 1
        return None if ok else "không phải đúng một lần đảo hai chữ cái cạnh nhau"
    if kind == "lặp từ":
        ok = len(tw) == len(ew) + 1 and any(tw[i] == tw[i + 1] and tw[:i] + tw[i + 1:] == ew for i in range(len(tw) - 1))
        return None if ok else "không phải bản lặp một từ của câu đúng"
    if kind == "dính từ (thiếu khoảng trắng)":
        ok = len(tw) == len(ew) - 1 and t.replace(" ", "") == e.replace(" ", "")
        return None if ok else "không phải bản dính hai từ của câu đúng"
    if kind == "chia động từ":
        d = [(a, b) for a, b in zip(tw, ew) if a != b]
        ok = len(tw) == len(ew) and len(d) == 1 and (d[0][0].lower(), d[0][1].lower()) in VERB_PAIRS | {(b, a) for a, b in VERB_PAIRS}
        return None if ok else "không phải đúng một lần đổi động từ is/are, was/were, has/have"
    if kind == "thiếu mạo từ":
        ok = len(ew) == len(tw) + 1 and any(ew[i].lower() in ARTICLES and ew[:i] + ew[i + 1:] == tw for i in range(len(ew)))
        return None if ok else "không phải câu đúng bị bỏ một mạo từ"
    return f"loại lỗi lạ: {kind}"


def search_ok(c):
    ids = [x["chunkId"] for x in c["chunks"]]
    if len(ids) != len(set(ids)):
        return "chunkId bị trùng"
    if not c["has_answer"]:
        return None if "target" not in ids else "ca không đáp án nhưng có target"
    if ids.count("target") != 1:
        return "không có đúng 1 đoạn target"
    if len(ids) != c["size"]:
        return f"số đoạn {len(ids)} khác size {c['size']}"
    target = next(x["text"] for x in c["chunks"] if x["chunkId"] == "target")
    if any(x["text"] == target for x in c["chunks"] if x["chunkId"] != "target"):
        return "có đoạn nhiễu trùng hệt đoạn đáp án (nhãn không còn duy nhất)"
    if target not in TEXT_TOPIC or c["query"] not in QUERY_TOPIC:
        return "target hoặc truy vấn không nằm trong testbank"
    if TEXT_TOPIC[target] != QUERY_TOPIC[c["query"]]:
        return "target và truy vấn thuộc HAI chủ đề khác nhau (nhãn sai)"
    return None


def other_ok(name, c):
    if name == "explain":
        terms = {t[5] for t in T} | {x[0] for x in EN_TERMS}
        ctxs = {t[1] for t in T} | {t[2] for t in T} | {x[1] for x in EN_TERMS} | {""}
        return None if c["text"] in terms and c["context"] in ctxs and c["language"] in ("vi", "en") else "thuật ngữ hoặc ngữ cảnh không nằm trong testbank"
    if name == "rewrite":
        if c["mode"] not in ("formal", "casual", "academic", "shorten", "improve"):
            return "mode lạ"
        if c["length"] == "câu":
            return None if c["text"] in SENT else "câu không nằm trong testbank"
        return None if all(part in c["text"] for part in [c["text"].split(". ")[0]]) and len(c["text"]) > 200 else "đoạn dài không đủ dài"
    if name == "robustness":
        if c["kind"] == "validation" and not c["expect_status"]:
            return "ca validation thiếu expect_status"
        notes = {"context 10.000 ký tự": 10000, "text rất dài 20.000 ký tự": 20000}
        for key, n in notes.items():
            if c["note"] == key:
                v = c["payload"].get("context") if "context" in key else c["payload"].get("text")
                return None if v is not None and len(v) == n else f"độ dài không đúng {n}"
        return None
    if name == "threshold_pairs":
        if c["label"] not in (0, 1) or c["a"] == c["b"]:
            return "nhãn không hợp lệ hoặc hai câu giống hệt nhau"
        return None
    return None


def main():
    report, bad_total = {}, 0
    for name, check in (("search", search_ok), ("grammar", grammar_ok)):
        cases = load_json(f"{name}_cases.json")
        report[name] = (cases, check)
    for name in ("explain", "rewrite", "robustness"):
        report[name] = (load_json(f"{name}_cases.json"), lambda c, n=name: other_ok(n, c))
    report["threshold_pairs"] = (load_json("threshold_pairs.json"), lambda c: other_ok("threshold_pairs", c))

    out, rows = {}, []
    for name, (cases, check) in report.items():
        ids = [c.get("id") for c in cases if "id" in c]
        errs = [{"id": c.get("id", i), "lý do": r} for i, c in enumerate(cases) if (r := check(c))]
        if len(ids) != len(set(ids)):
            errs.append({"id": "-", "lý do": "id bị trùng"})
        bad_total += len(errs)
        out[name] = {"số ca": len(cases), "số ca sai": len(errs), "ví dụ lỗi": errs[:10]}
        by_kind = defaultdict(int)
        for c in cases:
            by_kind[c.get("error_type") or c.get("kind") or c.get("group") or "-"] += 1
        rows.append((name, len(cases), len(errs)))
    save_json(RESULTS_DIR / "audit_report.json", {"generated_at": now(), "data_status": data_status(), "tổng ca sai": bad_total, "chi tiết": out})
    print(f"Nguồn data: {data_status()['state']}")
    print(f"{'NHÓM':<18}{'số ca':>8}{'ca sai':>9}")
    for n, k, b in rows:
        print(f"{n:<18}{k:>8}{b:>9}  {'✅' if b == 0 else '❌ xem results/audit_report.json'}")
    print(f"\n{'✅ Mọi ca đúng với định nghĩa.' if bad_total == 0 else '❌ Có ' + str(bad_total) + ' ca sai: KHÔNG dùng data này để chấm điểm cho tới khi sửa bộ sinh.'}")
    print("Lưu ý: audit chỉ chứng minh data khớp ĐỊNH NGHĨA. Câu gốc trong testbank.py vẫn cần người đọc duyệt.")
    sys.exit(1 if bad_total else 0)


if __name__ == "__main__":
    main()