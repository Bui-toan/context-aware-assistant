"""Chạy bộ test API (Explain / Grammar / Rewrite / Robustness) và LƯU kết quả.

  python run_eval.py explain --limit 20          # chạy 20 ca ngẫu nhiên (tiết kiệm quota Gemini)
  python run_eval.py all --limit 15              # mỗi nhóm 15 ca
  python run_eval.py grammar --limit 40          # mặc định tự chạy tiếp, bỏ qua ca đã có kết quả
  python run_eval.py grammar --fresh             # xóa kết quả cũ, chạy lại từ đầu
  python run_eval.py robustness --skip-llm       # chỉ test đầu vào sai (không tốn quota)
  python run_eval.py grammar_gold                # chấm bằng ĐÁP ÁN CHUẨN do người soạn (gold/*.json)
  python run_eval.py explain_gold | rewrite_gold # tương tự cho Explain và Rewrite
  python run_eval.py context_with | context_without   # THÍ NGHIỆM: cùng từ đa nghĩa, có và không có ngữ cảnh
  python run_eval.py explain_gold --repeat 3     # chạy mỗi ca 3 lần để đo độ dao động của LLM
  python run_eval.py report                      # gom mọi kết quả thành results/REPORT.md (gồm "context lift")

Kết quả:  results/<nhóm>.jsonl          (mỗi ca một dòng: đầu vào, đầu ra, lý do trượt)
          results/<nhóm>_summary.json   (số liệu tổng hợp)
          results/REPORT.md             (bảng tổng hợp để đưa vào báo cáo)
LƯU Ý QUOTA: mỗi ca Explain/Grammar/Rewrite tốn 1 request Gemini (gói Lite ~500 request/ngày, 15 request/phút).
"""
import argparse
import json
import random
import statistics
import time
from collections import defaultdict

from common import (DATA_DIR, GOLD_DIR, RESULTS_DIR, append_jsonl, backend_model, call, ci_text, data_status, ensure_backend,
                    err_code, git_commit, gold_status, has_term, load_gold, load_json, load_jsonl, norm, now, prompt_fingerprint,
                    save_json, sha256_file, sim, vi_ratio, wilson)

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
        answers = [c["expected"], *c.get("alternatives", [])]  # có thể có nhiều cách sửa đúng
        s_exp = max(sim(s, a) for a in answers)
        detected = norm(s) != norm(c["text"]) or len(b["errors"]) > 0
        extra = {"sim_expected": round(s_exp, 3), "detected": detected,
                 "improved": s_exp > max(sim(c["text"], a) for a in answers)}
        exact = any(norm(s) == norm(a) for a in answers)  # phải TRÙNG một đáp án chấp nhận được (sau khi chuẩn hóa)
        extra["exact"] = exact
        if not exact:
            why.append(f"không trùng đáp án đúng (độ giống {s_exp:.2f}" + (", chưa sửa gì" if norm(s) == norm(c["text"]) else "") + ")")
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


def check_explain_gold(c, res):
    """Như check_explain, thêm: phải nêu đủ các ý bắt buộc (mỗi nhóm từ đồng nghĩa phải xuất hiện ít nhất một từ)."""
    base = check_explain(c, res)
    why = list(base["reasons"])
    cov = 0.0
    if res["status"] == 200 and isinstance(res["body"], dict):
        b = res["body"]
        text = " ".join([str(b.get("meaning", "")), str(b.get("explanation", "")), " ".join(map(str, b.get("examples", []) or []))])
        groups = c.get("must_include", [])
        hit = [has_term(text, g) for g in groups]
        cov = sum(hit) / len(groups) if groups else 1.0
        miss = [g[0] for g, h in zip(groups, hit) if not h]
        if miss:
            why.append(f"thiếu ý bắt buộc: {miss}")
        bad = [w for w in c.get("must_not_include", []) if has_term(text, w)]
        if bad:
            why.append(f"có nội dung bị cấm: {bad}")
    return {"group": c["variant"], "pass": not why, "reasons": why, "coverage": round(cov, 2)}


def check_rewrite_gold(c, res):
    """Như check_rewrite, thêm: giữ nguyên số liệu/tên riêng (must_keep), không còn từ bị cấm, shorten phải thực sự ngắn hơn."""
    base = check_rewrite(c, res)
    why = list(base["reasons"])
    if res["status"] == 200 and is_str(res["body"].get("rewritten")):
        out = res["body"]["rewritten"]
        missing = [k if isinstance(k, str) else k[0] for k in c.get("must_keep", []) if not has_term(out, k)]
        if missing:
            why.append(f"mất thông tin bắt buộc: {missing}")
        bad = [w for w in c.get("must_not_contain", []) if has_term(out, w)]
        if bad:
            why.append(f"còn từ bị cấm: {bad}")
        if c["mode"] == "shorten" and len(out) >= len(c["text"]):
            why.append("shorten nhưng bản viết lại không ngắn hơn bản gốc")
    return {**base, "pass": not why, "reasons": why}


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


TASKS = {  # tên nhóm -> (file data, endpoint, hàm kiểm tra, là bộ đáp án chuẩn do người soạn?)
    "explain": ("explain_cases.json", "explain", check_explain, False),
    "grammar": ("grammar_cases.json", "grammar", check_grammar, False),
    "rewrite": ("rewrite_cases.json", "rewrite", check_rewrite, False),
    "robustness": ("robustness_cases.json", None, check_robust, False),
    "explain_gold": ("explain_gold.json", "explain", check_explain_gold, True),
    "grammar_gold": ("grammar_gold.json", "grammar", check_grammar, True),
    "rewrite_gold": ("rewrite_gold.json", "rewrite", check_rewrite_gold, True),
    "context_with": ("context_gold.json", "explain", check_explain_gold, True),     # có ngữ cảnh
    "context_without": ("context_gold.json", "explain", check_explain_gold, True),  # cùng ca nhưng BỎ ngữ cảnh
}


def payload_of(task, c):
    if task == "robustness":
        return c["payload"]
    p = {"text": c["text"], "context": c.get("context", ""), "language": c["language"]}
    if task == "context_without":
        p["context"] = ""
    if task.startswith("rewrite"):
        p["mode"] = c["mode"]
    return p


# ------------------------------------------------------------------ tổng hợp (luôn kèm số ca gốc và khoảng tin cậy)
def pctl(xs, p):
    s = sorted(xs)
    return round(s[int(p * (len(s) - 1))], 2) if s else 0


def summarize(task, recs, status=None):
    n = len(recs)
    k = sum(r["pass"] for r in recs)
    case_ids = {r.get("case_id", r["id"]) for r in recs}
    groups = defaultdict(list)
    for r in recs:
        groups[r["group"]].append(r)
    times = [r["time"] for r in recs]
    extra = {}
    if task.startswith("grammar"):
        err = [r for r in recs if r["group"] != "không có lỗi"]
        ok = [r for r in recs if r["group"] == "không có lỗi"]
        if err:
            extra["tỉ lệ phát hiện lỗi"] = ci_text(sum(r["detected"] for r in err), len(err))
            extra["tỉ lệ sửa tốt hơn bản gốc"] = ci_text(sum(r["improved"] for r in err), len(err))
            extra["độ giống TB với câu đúng"] = round(statistics.mean(r["sim_expected"] for r in err), 3)
        if ok:
            extra["tỉ lệ báo nhầm (câu đúng bị sửa)"] = ci_text(sum(r["false_positive"] for r in ok), len(ok))
    if task.startswith("rewrite"):
        rr = [r for r in recs if "similarity" in r]
        if rr:
            extra["similarity TB"] = round(statistics.mean(r["similarity"] for r in rr), 3)
            extra[f"tỉ lệ similarity ≥ {SIM_THRESHOLD}"] = ci_text(sum(r["sim_ok"] for r in rr), len(rr))
            extra["tỉ lệ có thay đổi so với bản gốc"] = ci_text(sum(r["changed"] for r in rr), len(rr))
    if task == "robustness":
        e = [r for r in recs if "format_ok" in r]
        extra["tỉ lệ lỗi đúng định dạng {error:{code,message}}"] = ci_text(sum(r["format_ok"] for r in e), len(e))
    by_case = defaultdict(list)
    for r in recs:
        by_case[r.get("case_id", r["id"])].append(r["pass"])
    rep = {c: v for c, v in by_case.items() if len(v) > 1}
    stability = ({"số ca chạy lặp": len(rep), "ca ổn định (mọi lần cùng kết quả)": sum(len(set(v)) == 1 for v in rep.values()),
                  "ca DAO ĐỘNG giữa các lần": sum(len(set(v)) > 1 for v in rep.values())} if rep else None)
    metas = sorted({json.dumps(r.get("meta", {}), sort_keys=True, ensure_ascii=False) for r in recs})
    S = {"task": task, "n_runs": n, "n_cases": len(case_ids), "pass": k, "pass_rate": round(k / n, 4) if n else 0,
         "pass_ci95": [round(x, 4) for x in wilson(k, n)],
         "groups": {g: {"n": len(v), "pass": sum(x["pass"] for x in v), "pass_rate": round(sum(x["pass"] for x in v) / len(v), 4),
                        "ci95": [round(x, 4) for x in wilson(sum(x["pass"] for x in v), len(v))]} for g, v in groups.items()},
         "time": {"mean": round(statistics.mean(times), 2) if times else 0, "median": pctl(times, 0.5), "p95": pctl(times, 0.95),
                  "max": round(max(times), 2) if times else 0},
         "retries": {"tổng số lần thử lại": sum(r.get("retries", 0) for r in recs), "số ca phải thử lại": sum(1 for r in recs if r.get("retries", 0))},
         "stability": stability, "extra": extra, "versions_in_results": [json.loads(m) for m in metas],
         "failures": [{"id": r["id"], "group": r["group"], "reasons": r["reasons"]} for r in recs if not r["pass"]][:40],
         "generated_at": now(), "reference_status": status, "code_version": git_commit()}
    save_json(RESULTS_DIR / f"{task}_summary.json", S)
    print(f"\n=== {task.upper()}: {ci_text(k, n)} | {len(case_ids)} ca gốc | thời gian TB {S['time']['mean']}s, p95 {S['time']['p95']}s")
    if n < 30:
        print("   ⚠ Mẫu nhỏ (<30): khoảng tin cậy rất rộng, đừng kết luận mạnh từ con số này.")
    for g, v in S["groups"].items():
        print(f"   {g:<42} {v['n']:>4} lần  đạt {v['pass_rate']:.1%}  (KTC {v['ci95'][0]:.0%}–{v['ci95'][1]:.0%})")
    for key, v in extra.items():
        print(f"   · {key}: {v}")
    if stability:
        print(f"   · độ ổn định khi chạy lặp: {stability}")
    if S["retries"]["số ca phải thử lại"]:
        print(f"   · {S['retries']['số ca phải thử lại']} lần gọi phải thử lại (lỗi thoáng qua đã bị che bớt)")
    if len(metas) > 1:
        print("   ⚠ Kết quả TRỘN nhiều phiên bản (model/prompt/data khác nhau): xem versions_in_results.")
    return S


# ------------------------------------------------------------------ chạy
def run_meta(src_path):
    m = {"model": backend_model(), "prompt_fp": prompt_fingerprint(), "ref_sha": sha256_file(src_path)[:12]}
    return m


def run_task(task, args):
    fname, ep, check, is_gold = TASKS[task]
    if is_gold:
        _, cases = load_gold(fname)
        status = gold_status()
        src = GOLD_DIR / fname
    else:
        cases = load_json(fname)
        status = data_status()
        src = DATA_DIR / fname
    print(f"\n🔎 Nguồn đáp án ({'GOLD do người soạn' if is_gold else 'data sinh tự động'}): {status['state']}"
          + (f" — {status['detail']}" if status.get("detail") else ""))
    if status["state"] in ("DRAFT", "TAMPERED", "MODIFIED", "UNKNOWN"):
        print("   ⚠ Kết quả bên dưới CHƯA có giá trị kiểm chứng vì đáp án chưa được duyệt/khóa hoặc đã bị sửa.")
    if task == "robustness" and args.skip_llm:
        cases = [c for c in cases if not c["uses_llm"]]

    meta = run_meta(src)
    if not meta["model"] and task != "robustness":
        print("   ⚠ Không đọc được tên model (đặt biến GEMINI_MODEL hoặc có dòng GEMINI_MODEL trong backend/.env) nên kết quả không ghi được model.")
    if not meta["prompt_fp"] and task != "robustness":
        print("   ⚠ Không nhận diện được file prompt (tên file chứa 'prompt'); đặt biến PROMPT_VERSION=<mã> để ghi lại phiên bản prompt.")
    out = RESULTS_DIR / f"{task}.jsonl"
    if args.fresh and out.exists():
        out.unlink()
    old = load_jsonl(out)
    key = lambda m: (m.get("model"), m.get("prompt_fp"), m.get("ref_sha"))
    if old and not args.allow_mixed and {key(r.get("meta", {})) for r in old} != {key(meta)}:
        raise SystemExit(f"❌ {out.name} đã có kết quả chạy bằng phiên bản KHÁC (model/prompt/đáp án). Trộn lẫn sẽ làm số liệu vô nghĩa.\n"
                         f"   Dùng --fresh để chạy lại từ đầu, hoặc --allow-mixed nếu chấp nhận (sẽ bị ghi chú vào báo cáo).")
    commits = {r.get("meta", {}).get("commit") for r in old} - {None}
    if commits and commits != {git_commit()}:
        print(f"   ⚠ Kết quả cũ chạy ở commit {sorted(commits)}, hiện là {git_commit()}: mã đã thay đổi giữa các lần chạy.")
    meta["commit"] = git_commit()
    run_id = now()

    done = {r["id"] for r in old}
    runs = [(c, k, f"{c['id']}#{k + 1}") for c in cases for k in range(args.repeat)]
    todo = [x for x in runs if x[2] not in done]
    if args.limit:
        todo = random.Random(args.seed).sample(todo, min(args.limit, len(todo)))
    print(f"▶ {task}: chạy {len(todo)} lượt (đã có {len(done)}; lặp {args.repeat} lần/ca) → {out}")
    for i, (c, k, rid) in enumerate(todo, 1):
        res = call(ep or c["endpoint"], payload_of(task, c))
        rec = check(c, res)
        rec.update(id=rid, case_id=c["id"], rep=k + 1, status=res["status"], time=res["time"], retries=res["retries"],
                   meta=meta, run_id=run_id,
                   input=payload_of(task, c) if task != "robustness" or len(str(c["payload"])) < 2000 else "(quá dài)",
                   output=res["body"] if len(str(res["body"])) < 3000 else str(res["body"])[:3000])
        for key_ in ("expected", "alternatives", "reference", "must_include", "must_keep"):
            if key_ in c:
                rec[key_] = c[key_]  # lưu kèm đáp án chuẩn để đối chiếu cạnh đầu ra
        append_jsonl(out, rec)
        print(f"  [{i}/{len(todo)}] {'✅' if rec['pass'] else '❌'} {rid} {rec['group']} ({res['time']}s)"
              + ("" if rec["pass"] else f"  → {'; '.join(rec['reasons'])}"))
        if (task != "robustness" or c["uses_llm"]) and i < len(todo):
            time.sleep(args.sleep)
    recs = load_jsonl(out)
    if recs:
        summarize(task, recs, status)


# ------------------------------------------------------------------ thí nghiệm "có ngữ cảnh" so với "không ngữ cảnh"
def context_lift(with_recs, without_recs):
    """So sánh theo từng cặp ca. Mỗi ca tính 'đạt' nếu đạt từ một nửa số lần chạy trở lên."""
    def agg(recs):
        d = defaultdict(list)
        for r in recs:
            d[r.get("case_id", r["id"])].append(r["pass"])
        return {c: (sum(v) / len(v)) >= 0.5 for c, v in d.items()}
    a, b = agg(with_recs), agg(without_recs)
    ids = sorted(set(a) & set(b))
    n = len(ids)
    both = sum(a[i] and b[i] for i in ids)
    only_w = sum(a[i] and not b[i] for i in ids)
    only_wo = sum(b[i] and not a[i] for i in ids)
    neither = n - both - only_w - only_wo
    pw, pwo = sum(a[i] for i in ids), sum(b[i] for i in ids)
    return {"n_cases": n, "pass_with_context": pw, "pass_without_context": pwo,
            "rate_with": round(pw / n, 4) if n else 0, "rate_without": round(pwo / n, 4) if n else 0,
            "lift_points": round((pw - pwo) / n * 100, 1) if n else 0,
            "chỉ_đúng_khi_có_ngữ_cảnh": only_w, "chỉ_đúng_khi_không_ngữ_cảnh": only_wo, "cả_hai_đúng": both, "cả_hai_sai": neither,
            "ci_with": [round(x, 3) for x in wilson(pw, n)], "ci_without": [round(x, 3) for x in wilson(pwo, n)]}


def report_context():
    w, wo = load_jsonl(RESULTS_DIR / "context_with.jsonl"), load_jsonl(RESULTS_DIR / "context_without.jsonl")
    if not w or not wo:
        return None
    L = context_lift(w, wo)
    save_json(RESULTS_DIR / "context_lift_summary.json", {**L, "generated_at": now(), "reference_status": gold_status()})
    return L


def report():
    lines = [f"# BÁO CÁO KẾT QUẢ TEST ({now()})", "", "Nguồn: các file `*_summary.json` và `*.jsonl` trong thư mục `results/`.",
             "Mọi tỉ lệ kèm số ca và khoảng tin cậy 95% (Wilson). Mẫu nhỏ thì khoảng rất rộng.", ""]
    L = report_context()
    if L:
        lines += ["## Thí nghiệm ngữ cảnh (Context lift)", "",
                  f"Cùng {L['n_cases']} ca từ đa nghĩa, chạy hai lần: có ngữ cảnh và không có ngữ cảnh.", "",
                  "| Điều kiện | Đạt | Tỉ lệ (KTC95%) |", "|---|---:|---|",
                  f"| Có ngữ cảnh | {L['pass_with_context']}/{L['n_cases']} | {L['rate_with']:.1%} ({L['ci_with'][0]:.0%}–{L['ci_with'][1]:.0%}) |",
                  f"| Không có ngữ cảnh | {L['pass_without_context']}/{L['n_cases']} | {L['rate_without']:.1%} ({L['ci_without'][0]:.0%}–{L['ci_without'][1]:.0%}) |",
                  "", f"**Chênh lệch: {L['lift_points']:+} điểm phần trăm.** Chỉ đúng khi có ngữ cảnh: {L['chỉ_đúng_khi_có_ngữ_cảnh']} ca; "
                  f"chỉ đúng khi không ngữ cảnh: {L['chỉ_đúng_khi_không_ngữ_cảnh']} ca; cả hai đúng: {L['cả_hai_đúng']}; cả hai sai: {L['cả_hai_sai']}.", ""]
    for task in TASKS:
        p = RESULTS_DIR / f"{task}_summary.json"
        if not p.exists():
            continue
        S = json.loads(p.read_text(encoding="utf-8"))
        st = S.get("reference_status") or {}
        lines += [f"## {task} — {ci_text(S['pass'], S['n_runs'])} ({S['n_cases']} ca gốc)", "",
                  f"Nguồn đáp án: **{st.get('state', 'không rõ')}**" + (f" (người duyệt: {', '.join(st['reviewers'])}, ngày {st.get('approved_at')})" if st.get("reviewers") else "")
                  + f" · commit: {S.get('code_version')}", ""]
        vers = S.get("versions_in_results") or []
        lines += ["Phiên bản đã chạy: " + "; ".join(f"model={v.get('model')}, prompt={v.get('prompt_fp')}, đáp án={v.get('ref_sha')}" for v in vers) + (" **(TRỘN NHIỀU PHIÊN BẢN)**" if len(vers) > 1 else ""), ""]
        lines += [f"Thời gian: TB {S['time']['mean']}s · trung vị {S['time']['median']}s · p95 {S['time']['p95']}s · max {S['time']['max']}s · "
                  f"{S['retries']['số ca phải thử lại']} lần gọi phải thử lại", "",
                  "| Nhóm | Số lần | Đạt | Tỉ lệ (KTC95%) |", "|---|---:|---:|---|"]
        lines += [f"| {k} | {v['n']} | {v['pass']} | {v['pass_rate']:.1%} ({v['ci95'][0]:.0%}–{v['ci95'][1]:.0%}) |" for k, v in S["groups"].items()]
        if S["extra"]:
            lines += ["", "Chỉ số bổ sung:"] + [f"- {k}: {v}" for k, v in S["extra"].items()]
        if S.get("stability"):
            lines += ["", f"Độ ổn định khi chạy lặp: {S['stability']}"]
        if S["failures"]:
            lines += ["", "<details><summary>Một số ca trượt</summary>", ""]
            lines += [f"- `{f['id']}` ({f['group']}): {'; '.join(f['reasons'])}" for f in S["failures"][:15]] + ["", "</details>"]
        lines.append("")
    for name, title in (("search_summary.json", "Semantic Search (data sinh)"), ("search_gold_summary.json", "Semantic Search (đáp án chuẩn)"),
                        ("threshold_summary.json", "Ngưỡng similarity")):
        p = RESULTS_DIR / name
        if p.exists():
            lines += [f"## {title}", "", "```json", p.read_text(encoding="utf-8")[:3000], "```", ""]
    out = RESULTS_DIR / "REPORT.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"✔ Đã ghi {out}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("task", choices=[*TASKS, "all", "report"])
    ap.add_argument("--limit", type=int, default=0, help="số lượt tối đa mỗi nhóm (0 = tất cả)")
    ap.add_argument("--sleep", type=float, default=4.5, help="giây nghỉ giữa 2 lần gọi LLM (15 request/phút ≈ 4.5s)")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--repeat", type=int, default=1, help="chạy mỗi ca N lần để đo độ dao động của LLM (tốn N lần quota)")
    ap.add_argument("--fresh", action="store_true", help="xóa kết quả cũ của nhóm rồi chạy lại")
    ap.add_argument("--allow-mixed", action="store_true", help="cho phép chạy tiếp dù kết quả cũ thuộc phiên bản khác (không khuyến khích)")
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