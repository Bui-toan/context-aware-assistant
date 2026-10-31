"""Đo ngưỡng similarity cho Rewrite Verification bằng chính model embedding (KHÔNG gọi backend, KHÔNG tốn quota).
  python eval_threshold.py [--model paraphrase-multilingual-mpnet-base-v2]
Kết quả: results/threshold_summary.json, results/threshold_pairs_scored.json
Ý nghĩa: cặp "cùng nghĩa" nên có điểm cao, cặp "đổi nghĩa" nên có điểm thấp -> chọn ngưỡng tách được hai nhóm.
"""
import argparse
from collections import defaultdict

import numpy as np

from common import RESULTS_DIR, load_json, now, save_json


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="paraphrase-multilingual-mpnet-base-v2")
    args = ap.parse_args()
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(args.model)
    pairs = load_json("threshold_pairs.json")
    a = model.encode([p["a"] for p in pairs], normalize_embeddings=True)
    b = model.encode([p["b"] for p in pairs], normalize_embeddings=True)
    sims = (a * b).sum(axis=1)
    for p, s in zip(pairs, sims):
        p["similarity"] = round(float(s), 4)
    labels = np.array([p["label"] for p in pairs])

    table = []
    for thr in np.arange(0.50, 0.96, 0.05):
        pred = (sims >= thr).astype(int)  # dự đoán "giữ nghĩa"
        tp = int(((pred == 1) & (labels == 1)).sum())
        fp = int(((pred == 1) & (labels == 0)).sum())
        fn = int(((pred == 0) & (labels == 1)).sum())
        prec = tp / (tp + fp) if tp + fp else 0.0
        rec = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
        table.append({"threshold": round(float(thr), 2), "precision": round(prec, 3), "recall": round(rec, 3),
                      "f1": round(f1, 3), "accuracy": round(float((pred == labels).mean()), 3)})
    by_group = defaultdict(list)
    for p in pairs:
        by_group[p["group"]].append(p["similarity"])
    groups = {g: {"n": len(v), "mean": round(float(np.mean(v)), 3), "min": round(min(v), 3), "max": round(max(v), 3)}
              for g, v in by_group.items()}
    best = max(table, key=lambda r: r["f1"])
    save_json(RESULTS_DIR / "threshold_summary.json", {"generated_at": now(), "model": args.model,
              "by_group": groups, "sweep": table, "best_by_f1": best, "chosen_threshold": 0.75})
    save_json(RESULTS_DIR / "threshold_pairs_scored.json", pairs)

    print(f"\n{'NHÓM CẶP CÂU':<36}{'n':>4}{'TB':>8}{'min':>8}{'max':>8}")
    for g, s in groups.items():
        print(f"{g:<36}{s['n']:>4}{s['mean']:>8.3f}{s['min']:>8.3f}{s['max']:>8.3f}")
    print(f"\n{'ngưỡng':>8}{'precision':>11}{'recall':>9}{'F1':>7}{'acc':>7}")
    for r in table:
        mark = "  ← đang dùng" if abs(r["threshold"] - 0.75) < 1e-9 else ""
        print(f"{r['threshold']:>8.2f}{r['precision']:>11.3f}{r['recall']:>9.3f}{r['f1']:>7.3f}{r['accuracy']:>7.3f}{mark}")
    print(f"\nNgưỡng tốt nhất theo F1: {best['threshold']}")
    print("Lưu ý: nhóm 'đảo nghĩa' có điểm cao nghĩa là embedding khó phát hiện phủ định -> nêu rõ trong phần hạn chế.")
    print(f"Lưu tại: {RESULTS_DIR / 'threshold_summary.json'}")


if __name__ == "__main__":
    main()