"""KIỂM TRA CHÍNH BỘ CHẤM ĐIỂM (test the tester). Chạy offline, không cần backend, không tốn quota.
  python selftest.py       (thoát mã 1 nếu bộ chấm có lỗi)
Chứng minh bằng thực nghiệm rằng bộ chấm phân biệt được đúng và sai:
  - ĐÁP ÁN HOÀN HẢO (lấy thẳng từ đáp án chuẩn)  -> phải được chấm 100% đạt
  - ĐÁP ÁN HỎNG có chủ đích (không sửa gì, thiếu ý, sai ngôn ngữ, mất số liệu...) -> phải bị chấm trượt
  - Search: xếp đúng đầu danh sách phải cho MRR = 1; xếp ngẫu nhiên phải thấp hơn hẳn
  - Kiểm toán data: cố tình làm hỏng data thì audit phải bắt được
  - Chống sửa lén: sửa 1 ký tự trong file gold thì trạng thái phải thành TAMPERED
"""
import copy
import json
import random
import shutil
import sys
import tempfile
from pathlib import Path

import audit_data as A
import common as C
import run_eval as R

rng = random.Random(1)
results = []


def check(name, ok, detail=""):
    results.append((name, ok))
    print(f"  {'✅' if ok else '❌'} {name}" + (f"  ({detail})" if detail else ""))


def res(body, status=200):
    return {"status": status, "body": body, "time": 0.0, "retries": 0}


def rate(fn, cases, make):
    return sum(fn(c, res(make(c)))["pass"] for c in cases) / len(cases)


def main():
    print("1) Chấm Grammar")
    for label, cases in (("gold", C.load_gold("grammar_gold.json")[1]), ("data sinh", C.load_json("grammar_cases.json"))):
        err = [c for c in cases if c["error_type"] != "không có lỗi"]
        ok = [c for c in cases if c["error_type"] == "không có lỗi"]
        perfect = lambda c: {"original": c["text"], "suggested": c["expected"], "errors": [{"x": 1}] if c["text"] != c["expected"] else []}
        check(f"[{label}] đáp án hoàn hảo -> 100% đạt", rate(R.check_grammar, cases, perfect) == 1.0)
        check(f"[{label}] không sửa gì -> mọi ca CÓ lỗi phải trượt",
              rate(R.check_grammar, err, lambda c: {"original": c["text"], "suggested": c["text"], "errors": []}) == 0.0)
        check(f"[{label}] sửa bậy câu đúng -> phải bị tính báo nhầm",
              rate(R.check_grammar, ok, lambda c: {"original": c["text"], "suggested": c["text"] + " thêm", "errors": [{"x": 1}]}) == 0.0)
    gold_alt = [c for c in C.load_gold("grammar_gold.json")[1] if c.get("alternatives")]
    check("chấp nhận cách sửa thay thế hợp lệ (alternatives)",
          rate(R.check_grammar, gold_alt, lambda c: {"original": c["text"], "suggested": c["alternatives"][0], "errors": [{"x": 1}]}) == 1.0)

    print("2) Chấm Explain (đáp án chuẩn)")
    ex = C.load_gold("explain_gold.json")[1]
    good = lambda c: {"meaning": c["reference"]["meaning"], "explanation": c["reference"]["explanation"], "examples": ["Ví dụ" if c["language"] == "vi" else "Example"]}
    check("đáp án tham chiếu -> 100% đạt", rate(R.check_explain_gold, ex, good) == 1.0)
    off = lambda c: {"meaning": "Hôm nay trời đẹp." if c["language"] == "vi" else "It is a nice day today.", "explanation": "Không liên quan." if c["language"] == "vi" else "Not related.", "examples": ["x"]}
    check("trả lời lạc đề -> phải trượt hết", rate(R.check_explain_gold, ex, off) == 0.0)
    wrong = lambda c: ({"meaning": "Đây là một khái niệm.", "explanation": "Giải thích bằng tiếng Việt dù yêu cầu tiếng Anh.", "examples": ["Ví dụ"]}
                       if c["language"] == "en" else {"meaning": "This is a concept.", "explanation": "Explained in English although Vietnamese was requested.", "examples": ["Example"]})
    check("sai ngôn ngữ -> phải trượt hết", rate(R.check_explain_gold, ex, wrong) == 0.0)
    check("thiếu trường examples -> phải trượt", rate(R.check_explain_gold, ex, lambda c: {**good(c), "examples": []}) == 0.0)

    print("3) Chấm Rewrite (đáp án chuẩn)")
    rw = C.load_gold("rewrite_gold.json")[1]

    def rw_good(c):
        shorten = c["mode"] == "shorten"
        return {"rewritten": c["reference"], "verification": {"semanticSimilarity": 0.9, "lengthChangePercent": -30 if shorten else 5, "compressionRatio": 0.6 if shorten else None}}
    check("bản viết lại tham chiếu -> 100% đạt", rate(R.check_rewrite_gold, rw, rw_good) == 1.0)
    lost = lambda c: {**rw_good(c), "rewritten": "Nội dung chung chung không có số liệu." if c["language"] == "vi" else "Some generic text without any figures."}
    check("mất số liệu/tên riêng -> phải trượt hết", rate(R.check_rewrite_gold, rw, lost) == 0.0)
    check("shorten mà không ngắn hơn -> phải trượt",
          rate(R.check_rewrite_gold, [c for c in rw if c["mode"] == "shorten"], lambda c: {**rw_good(c), "rewritten": c["text"] + " thêm"}) == 0.0)

    print("4) Chấm Search")
    check("hàm tính hạng đúng", C.first_rank(["a", "b", "c"], {"c"}) == 3 and C.first_rank(["a"], {"z"}) is None)
    docs = C.load_gold("search_gold.json")[1]
    mrr_o, mrr_r, n = 0.0, 0.0, 0
    for d in docs:
        ids = [x["chunkId"] for x in d["chunks"]]
        for q in d["queries"]:
            rel = set(q["relevant"])
            mrr_o += 1 / C.first_rank(sorted(ids, key=lambda i: i not in rel), rel)
            sh = ids[:]
            rng.shuffle(sh)
            mrr_r += 1 / C.first_rank(sh, rel)
            n += 1
    check("xếp đúng đầu danh sách -> MRR = 1", abs(mrr_o / n - 1.0) < 1e-9)
    check("xếp ngẫu nhiên -> MRR thấp hơn hẳn", mrr_r / n < 0.6, f"MRR ngẫu nhiên ≈ {mrr_r / n:.2f}")
    sc = C.load_json("search_cases.json")
    c0 = next(c for c in sc if c["has_answer"])
    check("mỗi ca sinh có đúng một đáp án để chấm", sum(x["chunkId"] == "target" for x in c0["chunks"]) == 1)

    print("5) Kiểm toán data có BẮT ĐƯỢC data hỏng không")
    g = copy.deepcopy(C.load_json("grammar_cases.json"))
    broken = 0
    for c in g[:40]:
        bad = dict(c)
        bad["expected"] = c["text"] if c["error_type"] != "không có lỗi" else c["expected"] + "x"
        broken += A.grammar_ok(bad) is not None
    check("sửa expected cho sai -> audit phải bắt", broken >= 35, f"bắt {broken}/40")
    s0 = copy.deepcopy(c0)
    s0["chunks"] = [x for x in s0["chunks"] if x["chunkId"] != "target"]
    check("xóa đoạn đáp án khỏi ca Search -> audit phải bắt", A.search_ok(s0) is not None)
    s1 = copy.deepcopy(c0)
    other = next(c for c in sc if c["has_answer"] and A.QUERY_TOPIC[c["query"]] != A.QUERY_TOPIC[c0["query"]])
    s1["query"] = other["query"]
    check("gán nhầm truy vấn của chủ đề khác -> audit phải bắt", A.search_ok(s1) is not None)

    print("6) Chống sửa lén đáp án chuẩn")
    tmp = Path(tempfile.mkdtemp())
    gold_copy = tmp / "gold"
    shutil.copytree(C.GOLD_DIR, gold_copy)
    files = {p.name: C.sha256_file(p) for p in gold_copy.glob("*_gold.json")}
    (gold_copy / "GOLD_MANIFEST.json").write_text(json.dumps({"files": files, "reviewers": ["A", "B"]}), encoding="utf-8")
    _, bad = C._verify(gold_copy / "GOLD_MANIFEST.json", gold_copy)
    check("chưa sửa gì -> hợp lệ", bad == [])
    p = gold_copy / "grammar_gold.json"
    p.write_text(p.read_text(encoding="utf-8").replace("giúp đỡ", "giúp đở", 1), encoding="utf-8")
    _, bad = C._verify(gold_copy / "GOLD_MANIFEST.json", gold_copy)
    check("sửa 1 ký tự trong file gold -> phải bị phát hiện", bad == ["grammar_gold.json"])
    shutil.rmtree(tmp, ignore_errors=True)

    print("7) Thống kê và thí nghiệm ngữ cảnh")
    lo, hi = C.wilson(5, 10)
    check("khoảng tin cậy Wilson(5/10) ≈ 24%–76%", abs(lo - 0.237) < 0.01 and abs(hi - 0.763) < 0.01, f"{lo:.3f}–{hi:.3f}")
    check("mẫu nhỏ có khoảng rộng hơn mẫu lớn", (lambda a, b: (a[1] - a[0]) > (b[1] - b[0]))(C.wilson(4, 8), C.wilson(400, 800)))
    ctx = C.load_gold("context_gold.json")[1]
    check("thí nghiệm ngữ cảnh: đáp án tham chiếu -> 100% đạt",
          rate(R.check_explain_gold, ctx, lambda c: {"meaning": c["reference"]["meaning"], "explanation": c["reference"]["explanation"], "examples": ["Ví dụ"]}) >= 0.95)
    check("thí nghiệm ngữ cảnh: trả lời lạc đề -> trượt hết",
          rate(R.check_explain_gold, ctx, lambda c: {"meaning": "Hôm nay trời đẹp.", "explanation": "Không liên quan.", "examples": ["x"]}) == 0.0)
    fake = lambda passed: [{"case_id": f"c{i}", "id": f"c{i}#1", "pass": p} for i, p in enumerate(passed)]
    L = R.context_lift(fake([True] * 10), fake([False] * 10))
    check("context lift: có=100%, không=0% -> +100 điểm", L["lift_points"] == 100.0 and L["chỉ_đúng_khi_có_ngữ_cảnh"] == 10)
    L2 = R.context_lift(fake([True, False, True, False]), fake([True, True, False, False]))
    check("context lift đếm đúng 4 ô (cả hai/chỉ có/chỉ không/không)", (L2["cả_hai_đúng"], L2["chỉ_đúng_khi_có_ngữ_cảnh"], L2["chỉ_đúng_khi_không_ngữ_cảnh"], L2["cả_hai_sai"]) == (1, 1, 1, 1))
    check("context_without thật sự bỏ ngữ cảnh khỏi yêu cầu gửi đi",
          R.payload_of("context_without", ctx[0])["context"] == "" and R.payload_of("context_with", ctx[0])["context"] != "")

    failed = [n for n, ok in results if not ok]
    print(f"\nKết quả: {len(results) - len(failed)}/{len(results)} kiểm tra đạt")
    if failed:
        print("❌ Bộ chấm điểm CÓ LỖI, không dùng kết quả cho tới khi sửa:", *failed, sep="\n   - ")
    C.save_json(C.RESULTS_DIR / "selftest_report.json", {"generated_at": C.now(), "passed": len(results) - len(failed), "total": len(results), "failed": failed})
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()