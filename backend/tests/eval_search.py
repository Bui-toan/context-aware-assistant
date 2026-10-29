"""Đánh giá Semantic Search trên data sinh sẵn (data/search_cases.json). KHÔNG tốn quota Gemini.
  python eval_search.py                 # chạy tất cả ca (≈ 420 ca, có thể mất vài phút)
  python eval_search.py --limit 60      # chạy nhanh
Kết quả: results/search.jsonl (từng ca), results/search_summary.json (tổng hợp)
"""
import argparse
import random
import statistics
from collections import defaultdict

from common import RESULTS_DIR, append_jsonl, call, ensure_backend, load_json, now, save_json


def stats(rows):
    n = len(rows)
    h1 = sum(r["rank"] == 1 for r in rows) / n
    h5 = sum(r["rank"] is not None and r["rank"] <= 5 for r in rows) / n
    mrr = sum(1 / r["rank"] if r["rank"] else 0 for r in rows) / n
    t = [r["time"] for r in rows]
    return {"n": n, "hit@1": round(h1, 4), "hit@5": round(h5, 4), "mrr": round(mrr, 4),
            "time_mean": round(statistics.mean(t), 3), "time_max": round(max(t), 3)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
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
    S = {"generated_at": now(), "overall": stats(rows), "by_kind": by("kind"), "by_size": by("size"), "http_errors": errors,
         "top1_score_when_answer_exists": round(statistics.mean(top_pos), 4) if top_pos else None,
         "top1_score_when_no_answer": round(statistics.mean(top_neg), 4) if top_neg else None,
         "failures_top5": [{"id": r["id"], "kind": r["kind"], "size": r["size"], "query": r["query"], "rank": r["rank"]}
                           for r in rows if r["rank"] is None or r["rank"] > 5][:40]}
    save_json(RESULTS_DIR / "search_summary.json", S)

    print("\n" + "=" * 70 + "\n📊 SEMANTIC SEARCH\n" + "=" * 70)
    print(f"{'NHÓM':<22}{'n':>5}{'Hit@1':>9}{'Hit@5':>9}{'MRR':>8}{'TB(s)':>8}")
    for title, d in (("TẤT CẢ", {"": S["overall"]}), *[(f"theo {k}", v) for k, v in (("kiểu query", S["by_kind"]), ("số đoạn", S["by_size"]))]):
        for name, s in d.items():
            label = f"{title} {name}".strip()
            print(f"{label:<22}{s['n']:>5}{s['hit@1']:>9.1%}{s['hit@5']:>9.1%}{s['mrr']:>8.2f}{s['time_mean']:>8.2f}")
    print(f"\nĐiểm top-1: có đáp án = {S['top1_score_when_answer_exists']} | không có đáp án = {S['top1_score_when_no_answer']}")
    print(f"Lưu tại: {RESULTS_DIR / 'search_summary.json'} và {out}")


if __name__ == "__main__":
    main()