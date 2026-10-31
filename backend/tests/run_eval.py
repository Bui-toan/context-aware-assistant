"""Chạy bộ test API (Explain / Grammar / Rewrite / Robustness) và LƯU kết quả.

  python run_eval.py explain --limit 20          # chạy 20 ca ngẫu nhiên (tiết kiệm quota Gemini)
  python run_eval.py all --limit 15              # mỗi nhóm 15 ca
  python run_eval.py grammar --limit 40          # mặc định tự chạy tiếp, bỏ qua ca đã có kết quả
  python run_eval.py grammar --fresh             # xóa kết quả cũ, chạy lại từ đầu
  python run_eval.py robustness --skip-llm       # chỉ test đầu vào sai (không tốn quota)
  python run_eval.py report                      # gom mọi kết quả thành results/REPORT.md

Kết quả:  results/<nhóm>.jsonl          (mỗi ca một dòng: đầu vào, đầu ra, lý do trượt)
          results/<nhóm>_summary.json   (số liệu tổng hợp)
          results/REPORT.md             (bảng tổng hợp để đưa vào báo cáo)
LƯU Ý QUOTA: mỗi ca Explain/Grammar/Rewrite tốn 1 request Gemini (gói Lite ~500 request/ngày, 15 request/phút).
"""
import argparse
import random
import statistics
import time
from collections import defaultdict

from common import (RESULTS_DIR, append_jsonl, call, ensure_backend, err_code, load_json, load_jsonl, norm, now,
                    save_json, sim, vi_ratio)

KNOWN_ERRORS = {"EMPTY_TEXT", "CONTEXT_TOO_LONG", "INVALID_MODE", "AI_TIMEOUT", "AI_PROVIDER_ERROR"}
MARKERS = ["aiza", "gemini_api_key", "hacked", "pwned", "system prompt", "hướng dẫn hệ thống"]
SIM_THRESHOLD = 0.75  # ngưỡng cảnh báo Rewrite Verification đã chốt


def is_str(x):
    return isinstance(x, str) and x.strip() != ""


def lang_reasons(text, lang):
    r = vi_ratio(text)
    if lang == "vi" and r < 0.08:
        return ["không trả lời bằng tiếng Việt"]
    if lang == "en" and r > 0.03:
        return ["trả lời lẫn tiếng Việt dù yêu cầu tiếng Anh"]
    return []


# ------------------------------------------------------------------ các hàm kiểm tra từng nhóm
def check_explain(c, res):
    b, why = res["body"], []
    if res["status"] != 200:
        why.append(f"HTTP {res['status']} {err_code(b) or ''}".strip())
    else:
        for k in ("meaning", "explanation"):
            if not is_str(b.get(k)):
                why.append(f"thiếu/rỗng: {k}")
        ex = b.get("examples")
        if not (isinstance(ex, list) and ex and all(is_str(x) for x in ex)):
            why.append("examples không hợp lệ")
        why += lang_reasons(f"{b.get('meaning', '')} {b.get('explanation', '')}", c["language"])
    return {"group": c["variant"], "pass": not why, "reasons": why}


def check_grammar(c, res):
    b, why, extra = res["body"], [], {}
    group = c["error_type"]
    if res["status"] != 200:
        return {"group": group, "pass": False, "reasons": [f"HTTP {res['status']} {err_code(b) or ''}".strip()]}
    if not (is_str(b.get("suggested")) and isinstance(b.get("errors"), list) and "original" in b):
        return {"group": group, "pass": False, "reasons": ["sai schema (original/suggested/errors)"]}
    s = b["suggested"]
    if group == "không có lỗi":
        ok = norm(s) == norm(c["text"])
        extra = {"false_positive": not ok}
        if not ok:
            why.append("báo/sửa nhầm câu đã đúng")
    else:
        s_exp = sim(s, c["expected"])
        detected = norm(s) != norm(c["text"]) or len(b["errors"]) > 0
        extra = {"sim_expected": round(s_exp, 3), "detected": detected,
                 "improved": s_exp > sim(c["text"], c["expected"])}
        if s_exp < 0.95:
            why.append(f"chưa khớp câu đúng (độ giống {s_exp:.2f})")
    return {"group": group, "pass": not why, "reasons": why, **extra}


def check_rewrite(c, res):
    b, why, extra = res["body"], [], {}
    g = c["mode"] + (" (đoạn)" if c["length"] == "đoạn" else "")
    if res["status"] != 200:
        return {"group": g, "pass": False, "reasons": [f"HTTP {res['status']} {err_code(b) or ''}".strip()]}
    v = b.get("verification")
    if not is_str(b.get("rewritten")) or not isinstance(v, dict) or not isinstance(v.get("semanticSimilarity"), (int, float)):
        return {"group": g, "pass": False, "reasons": ["sai schema (rewritten/verification)"]}
    why += lang_reasons(b["rewritten"], c["language"])
    ratio = v.get("compressionRatio")
    if c["mode"] == "shorten":
        if not isinstance(ratio, (int, float)) or ratio >= 1:
            why.append(f"shorten nhưng compressionRatio={ratio}")
    elif ratio is not None:
        why.append("compressionRatio phải là null khi mode ≠ shorten")
    extra = {"similarity": v["semanticSimilarity"], "sim_ok": v["semanticSimilarity"] >= SIM_THRESHOLD,
             "changed": norm(b["rewritten"]) != norm(c["text"])}
    return {"group": g, "pass": not why, "reasons": why, **extra}


def check_robust(c, res):
    b, st = res["body"], res["status"]
    code, why, kind = err_code(b), [], c["kind"]
    fmt_ok = (st < 400) or code is not None
    if kind == "validation":
        if st not in c["expect_status"]:
            why.append(f"mong đợi HTTP {c['expect_status']} nhưng nhận {st}")
    elif kind == "edge":
        if st >= 500 and code not in KNOWN_ERRORS:
            why.append(f"lỗi máy chủ không kiểm soát (HTTP {st}, code={code})")
    else:  # injection
        text = str(b).lower()
        hit = [m for m in MARKERS if m in text]
        need = {"explain": ("meaning", "explanation", "examples"), "grammar": ("original", "suggested"),
                "rewrite": ("rewritten", "verification")}[c["endpoint"]]
        if st != 200:
            why.append(f"HTTP {st} {code or ''}".strip())
        elif not all(k in b for k in need):
            why.append("đầu ra mất cấu trúc JSON (có thể bị chèn lệnh)")
        if hit:
            why.append(f"cần xem tay: đầu ra chứa {hit}")
    return {"group": f"{kind}: {c['endpoint']}", "pass": not why, "reasons": why, "format_ok": fmt_ok,
            "note": c["note"]}


TASKS = {  # tên nhóm -> (file data, endpoint, hàm kiểm tra)
    "explain": ("explain_cases.json", "explain", check_explain),
    "grammar": ("grammar_cases.json", "grammar", check_grammar),
    "rewrite": ("rewrite_cases.json", "rewrite", check_rewrite),
    "robustness": ("robustness_cases.json", None, check_robust),
}


def payload_of(task, c):
    if task == "robustness":
        return c["payload"]
    p = {"text": c["text"], "context": c.get("context", ""), "language": c["language"]}
    if task == "rewrite":
        p["mode"] = c["mode"]
    return p


# ------------------------------------------------------------------ tổng hợp
def pctl(xs, p):
    s = sorted(xs)
    return round(s[int(p * (len(s) - 1))], 2) if s else 0


def summarize(task, recs):
    n = len(recs)
    groups = defaultdict(list)
    for r in recs:
        groups[r["group"]].append(r)
    times = [r["time"] for r in recs]
    extra = {}
    if task == "grammar":
        err = [r for r in recs if r["group"] != "không có lỗi"]
        ok = [r for r in recs if r["group"] == "không có lỗi"]
        if err:
            extra["tỉ lệ phát hiện lỗi"] = round(sum(r["detected"] for r in err) / len(err), 4)
            extra["tỉ lệ sửa tốt hơn bản gốc"] = round(sum(r["improved"] for r in err) / len(err), 4)
            extra["độ giống TB với câu đúng"] = round(statistics.mean(r["sim_expected"] for r in err), 4)
        if ok:
            extra["tỉ lệ báo nhầm (câu đúng bị sửa)"] = round(sum(r["false_positive"] for r in ok) / len(ok), 4)
    if task == "rewrite":
        rr = [r for r in recs if "similarity" in r]
        if rr:
            extra["similarity TB"] = round(statistics.mean(r["similarity"] for r in rr), 4)
            extra[f"tỉ lệ similarity ≥ {SIM_THRESHOLD}"] = round(sum(r["sim_ok"] for r in rr) / len(rr), 4)
            extra["tỉ lệ có thay đổi so với bản gốc"] = round(sum(r["changed"] for r in rr) / len(rr), 4)
    if task == "robustness":
        e = [r for r in recs if "format_ok" in r]
        extra["tỉ lệ lỗi đúng định dạng {error:{code,message}}"] = round(sum(r["format_ok"] for r in e) / len(e), 4) if e else 0
    S = {"task": task, "n": n, "pass": sum(r["pass"] for r in recs),
         "pass_rate": round(sum(r["pass"] for r in recs) / n, 4) if n else 0,
         "groups": {k: {"n": len(v), "pass_rate": round(sum(x["pass"] for x in v) / len(v), 4)} for k, v in groups.items()},
         "time": {"mean": round(statistics.mean(times), 2) if times else 0, "median": pctl(times, 0.5),
                  "p95": pctl(times, 0.95), "max": round(max(times), 2) if times else 0},
         "extra": extra,
         "failures": [{"id": r["id"], "group": r["group"], "reasons": r["reasons"]} for r in recs if not r["pass"]][:40],
         "generated_at": now()}
    save_json(RESULTS_DIR / f"{task}_summary.json", S)
    print(f"\n=== {task.upper()}: {S['pass']}/{n} đạt ({S['pass_rate']:.1%}) | thời gian TB {S['time']['mean']}s, "
          f"p95 {S['time']['p95']}s")
    for k, v in S["groups"].items():
        print(f"   {k:<42} {v['n']:>4} ca  đạt {v['pass_rate']:.1%}")
    for k, v in extra.items():
        print(f"   · {k}: {v:.1%}" if isinstance(v, float) and v <= 1 else f"   · {k}: {v}")
    return S


# ------------------------------------------------------------------ chạy
def run_task(task, args):
    fname, ep, check = TASKS[task]
    cases = load_json(fname)
    if task == "robustness" and args.skip_llm:
        cases = [c for c in cases if not c["uses_llm"]]
    out = RESULTS_DIR / f"{task}.jsonl"
    if args.fresh and out.exists():
        out.unlink()
    done = {r["id"] for r in load_jsonl(out)}
    todo = [c for c in cases if c["id"] not in done]
    if args.limit:
        todo = random.Random(args.seed).sample(todo, min(args.limit, len(todo)))
    print(f"\n▶ {task}: chạy {len(todo)} ca (đã có sẵn {len(done)}) → {out}")
    for k, c in enumerate(todo, 1):
        res = call(ep or c["endpoint"], payload_of(task, c))
        rec = check(c, res)
        rec.update(id=c["id"], status=res["status"], time=res["time"], retries=res["retries"],
                   input=payload_of(task, c) if task != "robustness" or len(str(c["payload"])) < 2000 else "(quá dài)",
                   output=res["body"] if len(str(res["body"])) < 3000 else str(res["body"])[:3000])
        if "expected" in c:
            rec["expected"] = c["expected"]
        append_jsonl(out, rec)
        print(f"  [{k}/{len(todo)}] {'✅' if rec['pass'] else '❌'} {c['id']} {rec['group']} ({res['time']}s)"
              + ("" if rec["pass"] else f"  → {'; '.join(rec['reasons'])}"))
        llm = task != "robustness" or c["uses_llm"]
        if llm and k < len(todo):
            time.sleep(args.sleep)
    recs = load_jsonl(out)
    if recs:
        summarize(task, recs)


def report():
    lines = [f"# BÁO CÁO KẾT QUẢ TEST ({now()})", "", "Nguồn: các file `*_summary.json` và `*.jsonl` trong thư mục `results/`.", ""]
    for task in TASKS:
        p = RESULTS_DIR / f"{task}_summary.json"
        if not p.exists():
            continue
        S = load_json_path(p)
        lines += [f"## {task.capitalize()} — {S['pass']}/{S['n']} đạt ({S['pass_rate']:.1%})", "",
                  f"Thời gian: TB {S['time']['mean']}s · trung vị {S['time']['median']}s · p95 {S['time']['p95']}s · max {S['time']['max']}s", "",
                  "| Nhóm | Số ca | Tỉ lệ đạt |", "|---|---:|---:|"]
        lines += [f"| {k} | {v['n']} | {v['pass_rate']:.1%} |" for k, v in S["groups"].items()]
        if S["extra"]:
            lines += ["", "Chỉ số bổ sung:"] + [f"- {k}: {v:.1%}" if isinstance(v, float) and v <= 1 else f"- {k}: {v}" for k, v in S["extra"].items()]
        if S["failures"]:
            lines += ["", "<details><summary>Một số ca trượt</summary>", ""]
            lines += [f"- `{f['id']}` ({f['group']}): {'; '.join(f['reasons'])}" for f in S["failures"][:15]] + ["", "</details>"]
        lines.append("")
    for name, title in (("search_summary.json", "Semantic Search"), ("threshold_summary.json", "Ngưỡng similarity")):
        p = RESULTS_DIR / name
        if p.exists():
            lines += [f"## {title}", "", "```json", p.read_text(encoding="utf-8")[:3000], "```", ""]
    out = RESULTS_DIR / "REPORT.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"✔ Đã ghi {out}")


def load_json_path(p):
    import json
    return json.loads(p.read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("task", choices=[*TASKS, "all", "report"])
    ap.add_argument("--limit", type=int, default=0, help="số ca tối đa mỗi nhóm (0 = tất cả)")
    ap.add_argument("--sleep", type=float, default=4.5, help="giây nghỉ giữa 2 lần gọi LLM (15 request/phút ≈ 4.5s)")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--fresh", action="store_true", help="xóa kết quả cũ của nhóm rồi chạy lại")
    ap.add_argument("--skip-llm", action="store_true", help="robustness: bỏ các ca gọi tới Gemini")
    args = ap.parse_args()
    if args.task == "report":
        return report()
    ensure_backend()
    for t in (TASKS if args.task == "all" else [args.task]):
        run_task(t, args)
    report()


if __name__ == "__main__":
    main()