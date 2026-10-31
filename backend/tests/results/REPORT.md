# BÁO CÁO KẾT QUẢ TEST (2026-10-29T22:15:28)

Nguồn: các file `*_summary.json` và `*.jsonl` trong thư mục `results/`.

## Explain — 5/5 đạt (100.0%)

Thời gian: TB 25.89s · trung vị 26.77s · p95 27.57s · max 27.64s

| Nhóm | Số ca | Tỉ lệ đạt |
|---|---:|---:|
| thuật ngữ en → trả lời en | 1 | 100.0% |
| không có ngữ cảnh | 2 | 100.0% |
| ngữ cảnh vi → trả lời vi | 1 | 100.0% |
| ngữ cảnh vi → trả lời en | 1 | 100.0% |

## Grammar — 5/5 đạt (100.0%)

Thời gian: TB 25.62s · trung vị 27.68s · p95 28.11s · max 28.12s

| Nhóm | Số ca | Tỉ lệ đạt |
|---|---:|---:|
| mất dấu tiếng Việt | 1 | 100.0% |
| lặp từ | 2 | 100.0% |
| không có lỗi | 2 | 100.0% |

Chỉ số bổ sung:
- tỉ lệ phát hiện lỗi: 100.0%
- tỉ lệ sửa tốt hơn bản gốc: 100.0%
- độ giống TB với câu đúng: 100.0%
- tỉ lệ báo nhầm (câu đúng bị sửa): 0.0%

## Rewrite — 4/5 đạt (80.0%)

Thời gian: TB 27.28s · trung vị 26.91s · p95 29.02s · max 31.83s

| Nhóm | Số ca | Tỉ lệ đạt |
|---|---:|---:|
| shorten | 2 | 100.0% |
| casual | 1 | 0.0% |
| improve | 1 | 100.0% |
| formal | 1 | 100.0% |

Chỉ số bổ sung:
- similarity TB: 97.5%
- tỉ lệ similarity ≥ 0.75: 100.0%
- tỉ lệ có thay đổi so với bản gốc: 100.0%

<details><summary>Một số ca trượt</summary>

- `rewrite-0006` (casual): trả lời lẫn tiếng Việt dù yêu cầu tiếng Anh

</details>

## Robustness — 25/35 đạt (71.4%)

Thời gian: TB 14.14s · trung vị 2.06s · p95 41.9s · max 119.52s

| Nhóm | Số ca | Tỉ lệ đạt |
|---|---:|---:|
| validation: explain | 6 | 100.0% |
| validation: grammar | 6 | 33.3% |
| validation: rewrite | 9 | 55.6% |
| validation: search | 5 | 100.0% |
| edge: search | 4 | 100.0% |
| injection: rewrite | 2 | 0.0% |
| edge: explain | 2 | 100.0% |
| edge: grammar | 1 | 100.0% |

Chỉ số bổ sung:
- tỉ lệ lỗi đúng định dạng {error:{code,message}}: 60.0%

<details><summary>Một số ca trượt</summary>

- `robust-0022` (validation: grammar): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0023` (validation: grammar): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0026` (validation: grammar): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0027` (validation: grammar): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0044` (validation: rewrite): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0045` (validation: rewrite): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0048` (validation: rewrite): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0049` (validation: rewrite): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0058` (injection: rewrite): cần xem tay: đầu ra chứa ['hướng dẫn hệ thống']
- `robust-0065` (injection: rewrite): cần xem tay: đầu ra chứa ['pwned']

</details>

## Semantic Search

```json
{
  "generated_at": "2026-10-29T21:32:51",
  "overall": {
    "n": 100,
    "hit@1": 0.99,
    "hit@5": 0.99,
    "mrr": 0.99,
    "time_mean": 9.22,
    "time_max": 25.037
  },
  "by_kind": {
    "en→en": {
      "n": 25,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "mrr": 1.0,
      "time_mean": 9.584,
      "time_max": 25.037
    },
    "en→vi": {
      "n": 20,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "mrr": 1.0,
      "time_mean": 8.574,
      "time_max": 19.274
    },
    "ngắn vi→vi": {
      "n": 19,
      "hit@1": 0.9474,
      "hit@5": 0.9474,
      "mrr": 0.9474,
      "time_mean": 10.341,
      "time_max": 23.441
    },
    "vi→en": {
      "n": 21,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "mrr": 1.0,
      "time_mean": 9.07,
      "time_max": 22.375
    },
    "vi→vi": {
      "n": 15,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "mrr": 1.0,
      "time_mean": 8.264,
      "time_max": 22.337
    }
  },
  "by_size": {
    "10": {
      "n": 25,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "mrr": 1.0,
      "time_mean": 2.753,
      "time_max": 2.966
    },
    "50": {
      "n": 27,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "mrr": 1.0,
      "time_mean": 4.847,
      "time_max": 5.811
    },
    "150": {
      "n": 19,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "mrr": 1.0,
      "time_mean": 10.144,
      "time_max": 12.167
    },
    "300": {
      "n": 29,
      "hit@1": 0.9655,
      "hit@5": 0.9655,
      "mrr": 0.9655,
      "time_mean": 18.26,
      "time_max": 25.037
    }
  },
  "http_errors": 0,
  "top1_score_when_answer_exists": 0.6706,
  "top1_score_when_no_answer": null,
  "failures_top5": [
    {
      "id": "search-0409",
      "kind": "ngắn vi→vi",
      "size": 300,
      "query": "Everest",
      "rank": null
    }
  ]
}
```

## Ngưỡng similarity

```json
{
  "generated_at": "2026-10-29T21:41:17",
  "model": "paraphrase-multilingual-mpnet-base-v2",
  "by_group": {
    "cùng nghĩa (diễn đạt lại)": {
      "n": 16,
      "mean": 0.896,
      "min": 0.634,
      "max": 0.991
    },
    "đảo nghĩa (phủ định/trái nghĩa)": {
      "n": 16,
      "mean": 0.536,
      "min": 0.329,
      "max": 0.886
    },
    "đổi số/thực thể": {
      "n": 8,
      "mean": 0.652,
      "min": 0.399,
      "max": 0.893
    },
    "khác chủ đề (vi)": {
      "n": 20,
      "mean": 0.076,
      "min": -0.091,
      "max": 0.375
    },
    "khác chủ đề (en)": {
      "n": 20,
      "mean": 0.081,
      "min": -0.124,
      "max": 0.277
    }
  },
  "sweep": [
    {
      "threshold": 0.5,
      "precision": 0.533,
      "recall": 1.0,
      "f1": 0.696,
      "accuracy": 0.825
    },
    {
      "threshold": 0.55,
      "precision": 0.571,
      "recall": 1.0,
      "f1": 0.727,
      "accuracy": 0.85
    },
    {
      "threshold": 0.6,
      "precision": 0.667,
      "recall": 1.0,
      "f1": 0.8,
      "accuracy": 0.9
    },
    {
      "threshold": 0.65,
      "precision": 0.652,
      "recall": 0.938,
      "f1": 0.769,
      "accuracy": 0.887
    },
    {
      "threshold": 0.7,
      "precision": 0.667,
      "recall": 0.875,
      "f1": 0.757,
      "accuracy": 0.887
    },
    {
      "threshold": 0.75,
      "precision": 0.7,
      "recall": 0.875,
      "f1": 0.778,
      "accuracy": 0.9
    },
    {
      "threshold": 0.8,
      "precision": 0.722,
      "recall": 0.812,
      "f1": 0.765,
      "accuracy": 0.9
    },
    {
      "threshold": 0.85,
      "precision": 0.812,
      "recall": 0.812,
      "f1": 0.812,
      "accuracy": 0.925
    },
    {
      "threshold": 0.9,
      "precision": 1.0,
      "recall": 0.75,
      "f1": 0.857,
      "accuracy": 0.95
    },
    {
      "threshold": 0.95,
      "precision": 1.0,
      "recall": 0.312,
      "f1": 0.476,
      "accuracy": 0.863
    }
  ],
  "best_by_f1": {
    "threshold": 0.9,
    "precision": 1.0,
    "recall": 0.75,
    "f1": 0.857,
    "accuracy": 0.95
  },
  "chosen_threshold": 0.75
}
```
