"""Đánh giá Semantic Search trên data sinh sẵn (data/search_cases.json). KHÔNG tốn quota Gemini.
  python eval_search.py                 # chạy tất cả ca (≈ 420 ca, có thể mất vài phút)
  python eval_search.py --limit 60      # chạy nhanh
  python eval_search.py --gold          # chấm bằng ĐÁP ÁN CHUẨN do người gán nhãn (gold/search_gold.json)
Kết quả: results/search.jsonl (từng ca), results/search_summary.json (tổng hợp)
"""
import argparse
import random
import statistics
from collections import defaultdict

from common import (RESULTS_DIR, append_jsonl, call, ci_text, data_status, ensure_backend, first_rank, git_commit, gold_status,
                    load_gold, load_json, now, save_json)


def stats(rows):
    n = len(rows)
    k1 = sum(r["rank"] == 1 for r in rows)
    k5 = sum(r["rank"] is not None and r["rank"] <= 5 for r in rows)
    mrr = sum(1 / r["rank"] if r["rank"] else 0 for r in rows) / n
    t = [r["time"] for r in rows]
    return {"n": n, "n_unique_queries": len({r["query"] for r in rows}), "hit@1": round(k1 / n, 4), "hit@5": round(k5 / n, 4),
            "hit@1_text": ci_text(k1, n), "hit@5_text": ci_text(k5, n), "mrr": round(mrr, 4),
            "time_mean": round(statistics.mean(t), 3), "time_max": round(max(t), 3)}


def run_gold():
    """Chấm Search trên tài liệu có đáp án do NGƯỜI gán nhãn: mỗi truy vấn có danh sách đoạn liên quan (relevant)."""
    ensure_backend()
    status = gold_status()
    print(f"🔎 Nguồn đáp án (GOLD do người gán nhãn): {status['state']}" + (f" — {status['detail']}" if status.get("detail") else ""))
    if status["state"] != "APPROVED":
        print("   ⚠ Kết quả CHƯA có giá trị kiểm chứng vì đáp án chưa được duyệt/khóa hoặc đã bị sửa.")
    _, docs = load_gold("search_gold.json")
    out = RESULTS_DIR / "search_gold.jsonl"
    out.write_text("", encoding="utf-8")
    call("search", {"query": docs[0]["queries"][0]["query"], "chunks": docs[0]["chunks"], "topK": 5})  # làm nóng
    rows = []
    for d in docs:
        texts = {c["chunkId"]: c["text"] for c in d["chunks"]}
        for q in d["queries"]:
            res = call("search", {"query": q["query"], "chunks": d["chunks"], "topK": 10})
            results = res["body"].get("results", []) if res["status"] == 200 else []
            ids = [r["chunkId"] for r in results]
            rel = set(q["relevant"])
            row = {"id": q["id"], "doc": d["docId"], "query": q["query"], "query_lang": q["language"], "doc_lang": d["language"],
                   "relevant": q["relevant"], "relevant_text": [texts[i] for i in q["relevant"]], "rank": first_rank(ids, rel),
                   "recall5": len(rel & set(ids[:5])) / len(rel), "time": res["time"], "status": res["status"],
                   "top3": [{"chunkId": i, "text": texts.get(i, "")[:120]} for i in ids[:3]]}
            rows.append(row)
            append_jsonl(out, row)
            print(f"  {'✅' if row['rank'] == 1 else ('➖' if row['rank'] else '❌')} {q['id']}: hạng {row['rank']}  «{q['query']}»")
    S = {"generated_at": now(), "reference_status": status, "code_version": git_commit(), "overall": stats(rows),
         "cross_lingual": stats([r for r in rows if r["query_lang"] != r["doc_lang"]] or rows[:1]),
         "same_language": stats([r for r in rows if r["query_lang"] == r["doc_lang"]] or rows[:1]),
         "recall@5": round(sum(r["recall5"] for r in rows) / len(rows), 4),
         "failures_top5": [{"id": r["id"], "query": r["query"], "rank": r["rank"]} for r in rows if r["rank"] is None or r["rank"] > 5]}
    save_json(RESULTS_DIR / "search_gold_summary.json", S)
    o = S["overall"]
    print(f"\n📊 SEARCH (đáp án chuẩn): {o['n']} truy vấn | Hit@1 {o['hit@1_text']} | Hit@5 {o['hit@5_text']} | MRR {o['mrr']:.2f} | Recall@5 {S['recall@5']:.1%}")
    print('   ⚠ Chỉ 12 truy vấn: khoảng tin cậy rất rộng, đừng kết luận mạnh.')
    print(f"Lưu tại: {RESULTS_DIR / 'search_gold_summary.json'} và {out}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--gold", action="store_true", help="chấm bằng đáp án chuẩn do người gán nhãn")
    args = ap.parse_args()
    if args.gold:
        return run_gold()
    ensure_backend()
    cases = load_json("search_cases.json")
    pos = [c for c in cases if c["has_answer"]]
    neg = [c for c in cases if not c["has_answer"]]
    if args.limit:
        pos = random.Random(args.seed).sample(pos, min(args.limit, len(pos)))
    out = RESULTS_DIR / "search.jsonl"
    out.write_text("", encoding="utf-8")

    call("search", {"query": pos[0]["query"], "chunks": pos[0]["chunks"], "topK": 5})  # làm nóng model, không tính giờ
    rows, top_pos, top_neg, errors = [], [], [], 0
    for k, c in enumerate(pos, 1):
        res = call("search", {"query": c["query"], "chunks": c["chunks"], "topK": 10})
        if res["status"] != 200:
            errors += 1
            print(f"❌ {c['id']} HTTP {res['status']}")
            continue
        results = res["body"].get("results", [])
        ids = [r["chunkId"] for r in results]
        rank = ids.index("target") + 1 if "target" in ids else None
        texts = {x["chunkId"]: x["text"] for x in c["chunks"]}
        row = {"id": c["id"], "kind": c["kind"], "size": c["size"], "query": c["query"], "rank": rank, "time": res["time"],
               "top3": [{"chunkId": r["chunkId"], "score": r.get("score"), "text": texts.get(r["chunkId"], "")[:120]} for r in results[:3]],
               "target_text": texts["target"][:120]}
        rows.append(row)
        append_jsonl(out, row)
        if results and results[0].get("score") is not None:
            top_pos.append(results[0]["score"])
        if k % 20 == 0:
            print(f"  ... {k}/{len(pos)}")
    if not rows:
        raise SystemExit("Không có ca nào chạy thành công, kiểm tra lại backend và endpoint /api/search.")
    for c in neg:
        res = call("search", {"query": c["query"], "chunks": c["chunks"], "topK": 5})
        r = res["body"].get("results", []) if res["status"] == 200 else []
        if r and r[0].get("score") is not None:
            top_neg.append(r[0]["score"])

    by = lambda key: {str(k): stats(v) for k, v in sorted(
        {k: [r for r in rows if r[key] == k] for k in {r[key] for r in rows}}.items())}
    S = {"generated_at": now(), "reference_status": data_status(), "code_version": git_commit(), "overall": stats(rows), "by_kind": by("kind"), "by_size": by("size"), "http_errors": errors,
         "top1_score_when_answer_exists": round(statistics.mean(top_pos), 4) if top_pos else None,
         "top1_score_when_no_answer": round(statistics.mean(top_neg), 4) if top_neg else None,
         "failures_top5": [{"id": r["id"], "kind": r["kind"], "size": r["size"], "query": r["query"], "rank": r["rank"]}
                           for r in rows if r["rank"] is None or r["rank"] > 5][:40]}
    save_json(RESULTS_DIR / "search_summary.json", S)

    print("\n" + "=" * 70 + "\n📊 SEMANTIC SEARCH\n" + "=" * 70)
    print(f"{'NHÓM':<22}{'n':>5}{'độc lập':>9}{'Hit@1':>9}{'Hit@5':>9}{'MRR':>8}{'TB(s)':>8}")
    for title, d in (("TẤT CẢ", {"": S["overall"]}), *[(f"theo {k}", v) for k, v in (("kiểu query", S["by_kind"]), ("số đoạn", S["by_size"]))]):
        for name, s in d.items():
            label = f"{title} {name}".strip()
            print(f"{label:<22}{s['n']:>5}{s['n_unique_queries']:>9}{s['hit@1']:>9.1%}{s['hit@5']:>9.1%}{s['mrr']:>8.2f}{s['time_mean']:>8.2f}")
    print("   (cột 'độc lập' = số truy vấn khác nhau; data sinh lặp lại cùng truy vấn ở nhiều kích thước trang nên số mẫu thật nhỏ hơn n)")
    print(f"\nĐiểm top-1: có đáp án = {S['top1_score_when_answer_exists']} | không có đáp án = {S['top1_score_when_no_answer']}")
    print(f"Lưu tại: {RESULTS_DIR / 'search_summary.json'} và {out}")


if __name__ == "__main__":
    main()