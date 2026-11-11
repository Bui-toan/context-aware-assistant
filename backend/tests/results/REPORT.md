# BÁO CÁO KẾT QUẢ TEST (2026-11-11T21:24:28)

Nguồn: các file `*_summary.json` và `*.jsonl` trong thư mục `results/`.
Mọi tỉ lệ kèm số ca và khoảng tin cậy 95% (Wilson). Mẫu nhỏ thì khoảng rất rộng.

## Thí nghiệm ngữ cảnh (Context lift)

Cùng 24 ca từ đa nghĩa, chạy hai lần: có ngữ cảnh và không có ngữ cảnh.

| Điều kiện | Đạt | Tỉ lệ (KTC95%) |
|---|---:|---|
| Có ngữ cảnh | 23/24 | 95.8% (80%–99%) |
| Không có ngữ cảnh | 20/24 | 83.3% (64%–93%) |

**Chênh lệch: +12.5 điểm phần trăm.** Chỉ đúng khi có ngữ cảnh: 4 ca; chỉ đúng khi không ngữ cảnh: 1 ca; cả hai đúng: 19; cả hai sai: 0.

## explain — 100.0% (30/30; KTC95% 89%–100%) (30 ca gốc)

Nguồn đáp án: **GENERATED** · commit: 42b8e0d

Phiên bản đã chạy: model=gemini-3.5-flash-lite, prompt=0fcf3ea225fe, đáp án=66e292852180

Thời gian: TB 3.43s · trung vị 3.44s · p95 3.66s · max 3.83s · 0 lần gọi phải thử lại

| Nhóm | Số lần | Đạt | Tỉ lệ (KTC95%) |
|---|---:|---:|---|
| thuật ngữ en → trả lời en | 4 | 4 | 100.0% (51%–100%) |
| không có ngữ cảnh | 6 | 6 | 100.0% (61%–100%) |
| ngữ cảnh vi → trả lời vi | 6 | 6 | 100.0% (61%–100%) |
| ngữ cảnh vi → trả lời en | 9 | 9 | 100.0% (70%–100%) |
| thuật ngữ en → trả lời vi | 5 | 5 | 100.0% (57%–100%) |

## grammar — 93.3% (28/30; KTC95% 79%–98%) (30 ca gốc)

Nguồn đáp án: **GENERATED** · commit: 42b8e0d

Phiên bản đã chạy: model=gemini-3.5-flash-lite, prompt=5bf9644e3c7e, đáp án=a977844505b6

Thời gian: TB 9.19s · trung vị 5.65s · p95 16.88s · max 62.56s · 0 lần gọi phải thử lại

| Nhóm | Số lần | Đạt | Tỉ lệ (KTC95%) |
|---|---:|---:|---|
| mất dấu tiếng Việt | 4 | 3 | 75.0% (30%–95%) |
| lặp từ | 6 | 6 | 100.0% (61%–100%) |
| không có lỗi | 10 | 9 | 90.0% (60%–98%) |
| chia động từ | 1 | 1 | 100.0% (21%–100%) |
| dính từ (thiếu khoảng trắng) | 4 | 4 | 100.0% (51%–100%) |
| lỗi chính tả (đảo chữ) | 5 | 5 | 100.0% (57%–100%) |

Chỉ số bổ sung:
- tỉ lệ phát hiện lỗi: 100.0% (20/20; KTC95% 84%–100%)
- tỉ lệ sửa tốt hơn bản gốc: 95.0% (19/20; KTC95% 76%–99%)
- độ giống TB với câu đúng: 0.987
- tỉ lệ báo nhầm (câu đúng bị sửa): 10.0% (1/10; KTC95% 2%–40%)

<details><summary>Một số ca trượt</summary>

- `grammar-0173#1` (mất dấu tiếng Việt): không trùng đáp án đúng (độ giống 0.75, chưa sửa gì)
- `grammar-0008#1` (không có lỗi): báo/sửa nhầm câu đã đúng

</details>

## rewrite — 96.7% (29/30; KTC95% 83%–99%) (30 ca gốc)

Nguồn đáp án: **GENERATED** · commit: 42b8e0d

Phiên bản đã chạy: model=gemini-3.5-flash-lite, prompt=5bf9644e3c7e, đáp án=155afe70ad64

Thời gian: TB 5.82s · trung vị 4.79s · p95 10.49s · max 10.96s · 0 lần gọi phải thử lại

| Nhóm | Số lần | Đạt | Tỉ lệ (KTC95%) |
|---|---:|---:|---|
| shorten | 9 | 9 | 100.0% (70%–100%) |
| casual | 4 | 4 | 100.0% (51%–100%) |
| improve | 6 | 6 | 100.0% (61%–100%) |
| formal | 4 | 3 | 75.0% (30%–95%) |
| academic | 5 | 5 | 100.0% (57%–100%) |
| shorten (đoạn) | 2 | 2 | 100.0% (34%–100%) |

Chỉ số bổ sung:
- similarity TB: 0.939
- tỉ lệ similarity ≥ 0.75: 100.0% (30/30; KTC95% 89%–100%)
- tỉ lệ có thay đổi so với bản gốc: 100.0% (30/30; KTC95% 89%–100%)

<details><summary>Một số ca trượt</summary>

- `rewrite-0070#1` (formal): không trả lời bằng tiếng Việt

</details>

## robustness — 87.2% (75/86; KTC95% 79%–93%) (86 ca gốc)

Nguồn đáp án: **GENERATED** · commit: 42b8e0d

Phiên bản đã chạy: model=gemini-3.5-flash-lite, prompt=5bf9644e3c7e, đáp án=784ab4f00d7e

Thời gian: TB 4.97s · trung vị 3.6s · p95 7.92s · max 72.73s · 4 lần gọi phải thử lại

| Nhóm | Số lần | Đạt | Tỉ lệ (KTC95%) |
|---|---:|---:|---|
| validation: explain | 6 | 3 | 50.0% (19%–81%) |
| edge: explain | 8 | 8 | 100.0% (68%–100%) |
| injection: explain | 16 | 15 | 93.8% (72%–99%) |
| validation: grammar | 6 | 3 | 50.0% (19%–81%) |
| edge: grammar | 8 | 8 | 100.0% (68%–100%) |
| injection: grammar | 8 | 7 | 87.5% (53%–98%) |
| validation: rewrite | 9 | 6 | 66.7% (35%–88%) |
| edge: rewrite | 8 | 8 | 100.0% (68%–100%) |
| injection: rewrite | 8 | 8 | 100.0% (68%–100%) |
| validation: search | 5 | 5 | 100.0% (57%–100%) |
| edge: search | 4 | 4 | 100.0% (51%–100%) |

Chỉ số bổ sung:
- tỉ lệ lỗi đúng định dạng {error:{code,message}}: 87.2% (75/86; KTC95% 79%–93%)

<details><summary>Một số ca trượt</summary>

- `robust-0003#1` (validation: explain): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0004#1` (validation: explain): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0005#1` (validation: explain): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0021#1` (injection: explain): HTTP 500 AI_PROVIDER_ERROR
- `robust-0025#1` (validation: grammar): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0026#1` (validation: grammar): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0027#1` (validation: grammar): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0039#1` (injection: grammar): HTTP 500 AI_PROVIDER_ERROR
- `robust-0047#1` (validation: rewrite): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0048#1` (validation: rewrite): mong đợi HTTP [400, 422] nhưng nhận 200
- `robust-0049#1` (validation: rewrite): mong đợi HTTP [400, 422] nhưng nhận 200

</details>

## explain_gold — 100.0% (24/24; KTC95% 86%–100%) (8 ca gốc)

Nguồn đáp án: **APPROVED** (người duyệt: Bùi Khánh Toàn, Nguyễn Hoàng Phú, ngày 2026-11-11T10:24:31) · commit: 42b8e0d

Phiên bản đã chạy: model=gemini-3.5-flash-lite, prompt=0fcf3ea225fe, đáp án=0315922299f7

Thời gian: TB 7.91s · trung vị 7.67s · p95 11.57s · max 19.5s · 0 lần gọi phải thử lại

| Nhóm | Số lần | Đạt | Tỉ lệ (KTC95%) |
|---|---:|---:|---|
| thuật ngữ kỹ thuật | 3 | 3 | 100.0% (44%–100%) |
| từ đa nghĩa: bờ sông | 3 | 3 | 100.0% (44%–100%) |
| từ đa nghĩa: ngân hàng | 3 | 3 | 100.0% (44%–100%) |
| thuật ngữ, trả lời tiếng Anh | 3 | 3 | 100.0% (44%–100%) |
| khái niệm khoa học | 3 | 3 | 100.0% (44%–100%) |
| khái niệm kinh tế | 3 | 3 | 100.0% (44%–100%) |
| ngữ cảnh tiếng Anh, trả lời tiếng Việt | 3 | 3 | 100.0% (44%–100%) |
| từ đa nghĩa: công ty | 3 | 3 | 100.0% (44%–100%) |

Độ ổn định khi chạy lặp: {'số ca chạy lặp': 8, 'ca ổn định (mọi lần cùng kết quả)': 8, 'ca DAO ĐỘNG giữa các lần': 0}

## grammar_gold — 94.7% (54/57; KTC95% 86%–98%) (19 ca gốc)

Nguồn đáp án: **APPROVED** (người duyệt: Bùi Khánh Toàn, Nguyễn Hoàng Phú, ngày 2026-11-11T10:24:31) · commit: 42b8e0d

Phiên bản đã chạy: model=gemini-3.5-flash-lite, prompt=0fcf3ea225fe, đáp án=aed3f9ae923b

Thời gian: TB 5.27s · trung vị 3.96s · p95 9.32s · max 10.22s · 0 lần gọi phải thử lại

| Nhóm | Số lần | Đạt | Tỉ lệ (KTC95%) |
|---|---:|---:|---|
| mất dấu | 3 | 3 | 100.0% (44%–100%) |
| chính tả | 12 | 12 | 100.0% (76%–100%) |
| lặp từ | 6 | 6 | 100.0% (61%–100%) |
| dính từ | 3 | 3 | 100.0% (44%–100%) |
| không có lỗi | 12 | 9 | 75.0% (47%–91%) |
| chia động từ | 12 | 12 | 100.0% (76%–100%) |
| nhầm từ | 3 | 3 | 100.0% (44%–100%) |
| nhiều lỗi | 3 | 3 | 100.0% (44%–100%) |
| dạng động từ | 3 | 3 | 100.0% (44%–100%) |

Chỉ số bổ sung:
- tỉ lệ phát hiện lỗi: 100.0% (45/45; KTC95% 92%–100%)
- tỉ lệ sửa tốt hơn bản gốc: 100.0% (45/45; KTC95% 92%–100%)
- độ giống TB với câu đúng: 1.0
- tỉ lệ báo nhầm (câu đúng bị sửa): 25.0% (3/12; KTC95% 9%–53%)

Độ ổn định khi chạy lặp: {'số ca chạy lặp': 19, 'ca ổn định (mọi lần cùng kết quả)': 19, 'ca DAO ĐỘNG giữa các lần': 0}

<details><summary>Một số ca trượt</summary>

- `g-gram-09#1` (không có lỗi): báo/sửa nhầm câu đã đúng
- `g-gram-09#2` (không có lỗi): báo/sửa nhầm câu đã đúng
- `g-gram-09#3` (không có lỗi): báo/sửa nhầm câu đã đúng

</details>

## rewrite_gold — 72.2% (13/18; KTC95% 49%–88%) (6 ca gốc)

Nguồn đáp án: **APPROVED** (người duyệt: Bùi Khánh Toàn, Nguyễn Hoàng Phú, ngày 2026-11-11T10:24:31) · commit: 42b8e0d

Phiên bản đã chạy: model=gemini-3.5-flash-lite, prompt=0fcf3ea225fe, đáp án=c01656efddf8

Thời gian: TB 4.48s · trung vị 3.99s · p95 7.02s · max 8.91s · 0 lần gọi phải thử lại

| Nhóm | Số lần | Đạt | Tỉ lệ (KTC95%) |
|---|---:|---:|---|
| formal | 3 | 3 | 100.0% (44%–100%) |
| casual | 3 | 3 | 100.0% (44%–100%) |
| academic | 3 | 3 | 100.0% (44%–100%) |
| shorten (đoạn) | 6 | 4 | 66.7% (30%–90%) |
| improve | 3 | 0 | 0.0% (0%–56%) |

Chỉ số bổ sung:
- similarity TB: 0.932
- tỉ lệ similarity ≥ 0.75: 100.0% (18/18; KTC95% 82%–100%)
- tỉ lệ có thay đổi so với bản gốc: 100.0% (18/18; KTC95% 82%–100%)

Độ ổn định khi chạy lặp: {'số ca chạy lặp': 6, 'ca ổn định (mọi lần cùng kết quả)': 5, 'ca DAO ĐỘNG giữa các lần': 1}

<details><summary>Một số ca trượt</summary>

- `g-rew-05#1` (shorten (đoạn)): shorten nhưng compressionRatio=1.005181347150259; shorten nhưng bản viết lại không ngắn hơn bản gốc
- `g-rew-05#3` (shorten (đoạn)): shorten nhưng compressionRatio=1.0103626943005182; shorten nhưng bản viết lại không ngắn hơn bản gốc
- `g-rew-06#1` (improve): mất thông tin bắt buộc: ['5 May']
- `g-rew-06#2` (improve): mất thông tin bắt buộc: ['5 May']
- `g-rew-06#3` (improve): mất thông tin bắt buộc: ['5 May']

</details>

## context_with — 97.2% (70/72; KTC95% 90%–99%) (24 ca gốc)

Nguồn đáp án: **APPROVED** (người duyệt: Bùi Khánh Toàn, Nguyễn Hoàng Phú, ngày 2026-11-11T10:24:31) · commit: 42b8e0d

Phiên bản đã chạy: model=gemini-3.5-flash-lite, prompt=0fcf3ea225fe, đáp án=f4d4c4fc340a

Thời gian: TB 4.67s · trung vị 4.57s · p95 7.21s · max 7.94s · 0 lần gọi phải thử lại

| Nhóm | Số lần | Đạt | Tỉ lệ (KTC95%) |
|---|---:|---:|---|
| tiếng Anh đa nghĩa | 48 | 48 | 100.0% (93%–100%) |
| tiếng Việt đa nghĩa | 24 | 22 | 91.7% (74%–98%) |

Độ ổn định khi chạy lặp: {'số ca chạy lặp': 24, 'ca ổn định (mọi lần cùng kết quả)': 23, 'ca DAO ĐỘNG giữa các lần': 1}

<details><summary>Một số ca trượt</summary>

- `g-ctx-23#2` (tiếng Việt đa nghĩa): thiếu ý bắt buộc: ['muồi']
- `g-ctx-23#3` (tiếng Việt đa nghĩa): thiếu ý bắt buộc: ['muồi']

</details>

## context_without — 83.3% (60/72; KTC95% 73%–90%) (24 ca gốc)

Nguồn đáp án: **APPROVED** (người duyệt: Bùi Khánh Toàn, Nguyễn Hoàng Phú, ngày 2026-11-11T10:24:31) · commit: 42b8e0d

Phiên bản đã chạy: model=gemini-3.5-flash-lite, prompt=0fcf3ea225fe, đáp án=f4d4c4fc340a

Thời gian: TB 3.54s · trung vị 3.44s · p95 3.71s · max 8.29s · 0 lần gọi phải thử lại

| Nhóm | Số lần | Đạt | Tỉ lệ (KTC95%) |
|---|---:|---:|---|
| tiếng Anh đa nghĩa | 48 | 40 | 83.3% (70%–91%) |
| tiếng Việt đa nghĩa | 24 | 20 | 83.3% (64%–93%) |

Độ ổn định khi chạy lặp: {'số ca chạy lặp': 24, 'ca ổn định (mọi lần cùng kết quả)': 20, 'ca DAO ĐỘNG giữa các lần': 4}

<details><summary>Một số ca trượt</summary>

- `g-ctx-06#1` (tiếng Anh đa nghĩa): thiếu ý bắt buộc: ['rắn']
- `g-ctx-06#2` (tiếng Anh đa nghĩa): thiếu ý bắt buộc: ['rắn']
- `g-ctx-06#3` (tiếng Anh đa nghĩa): thiếu ý bắt buộc: ['rắn']
- `g-ctx-07#2` (tiếng Anh đa nghĩa): thiếu ý bắt buộc: ['cà phê']
- `g-ctx-07#3` (tiếng Anh đa nghĩa): thiếu ý bắt buộc: ['cà phê']
- `g-ctx-11#3` (tiếng Anh đa nghĩa): thiếu ý bắt buộc: ['lò xo']
- `g-ctx-15#1` (tiếng Anh đa nghĩa): thiếu ý bắt buộc: ['máy tính']
- `g-ctx-15#3` (tiếng Anh đa nghĩa): thiếu ý bắt buộc: ['máy tính']
- `g-ctx-19#2` (tiếng Việt đa nghĩa): thiếu ý bắt buộc: ['thảo luận']
- `g-ctx-22#1` (tiếng Việt đa nghĩa): thiếu ý bắt buộc: ['sinh mạng']
- `g-ctx-22#2` (tiếng Việt đa nghĩa): thiếu ý bắt buộc: ['sinh mạng']
- `g-ctx-22#3` (tiếng Việt đa nghĩa): thiếu ý bắt buộc: ['sinh mạng']

</details>

## Semantic Search (data sinh)

```json
{
  "generated_at": "2026-11-11T10:53:02",
  "reference_status": {
    "state": "GENERATED",
    "seed": 42,
    "generated_at": "2026-11-11T09:48:49",
    "testbank_sha256": "e933efb82dbf"
  },
  "code_version": "42b8e0d",
  "overall": {
    "n": 100,
    "n_unique_queries": 53,
    "hit@1": 0.99,
    "hit@5": 0.99,
    "hit@1_text": "99.0% (99/100; KTC95% 95%–100%)",
    "hit@5_text": "99.0% (99/100; KTC95% 95%–100%)",
    "mrr": 0.99,
    "time_mean": 7.782,
    "time_max": 19.2
  },
  "by_kind": {
    "en→en": {
      "n": 25,
      "n_unique_queries": 15,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "hit@1_text": "100.0% (25/25; KTC95% 87%–100%)",
      "hit@5_text": "100.0% (25/25; KTC95% 87%–100%)",
      "mrr": 1.0,
      "time_mean": 7.995,
      "time_max": 17.615
    },
    "en→vi": {
      "n": 20,
      "n_unique_queries": 15,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "hit@1_text": "100.0% (20/20; KTC95% 84%–100%)",
      "hit@5_text": "100.0% (20/20; KTC95% 84%–100%)",
      "mrr": 1.0,
      "time_mean": 7.691,
      "time_max": 19.2
    },
    "ngắn vi→vi": {
      "n": 19,
      "n_unique_queries": 13,
      "hit@1": 0.9474,
      "hit@5": 0.9474,
      "hit@1_text": "94.7% (18/19; KTC95% 75%–99%)",
      "hit@5_text": "94.7% (18/19; KTC95% 75%–99%)",
      "mrr": 0.9474,
      "time_mean": 8.375,
      "time_max": 15.76
    },
    "vi→en": {
      "n": 21,
      "n_unique_queries": 16,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "hit@1_text": "100.0% (21/21; KTC95% 85%–100%)",
      "hit@5_text": "100.0% (21/21; KTC95% 85%–100%)",
      "mrr": 1.0,
      "time_mean": 7.839,
      "time_max": 15.218
    },
    "vi→vi": {
      "n": 15,
      "n_unique_queries": 14,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "hit@1_text": "100.0% (15/15; KTC95% 80%–100%)",
      "hit@5_text": "100.0% (15/15; KTC95% 80%–100%)",
      "mrr": 1.0,
      "time_mean": 6.714,
      "time_max": 15.468
    }
  },
  "by_size": {
    "10": {
      "n": 25,
      "n_unique_queries": 24,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "hit@1_text": "100.0% (25/25; KTC95% 87%–100%)",
      "hit@5_text": "100.0% (25/25; KTC95% 87%–100%)",
      "mrr": 1.0,
      "time_mean": 2.577,
      "time_max": 2.813
    },
    "50": {
      "n": 27,
      "n_unique_queries": 23,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "hit@1_text": "100.0% (27/27; KTC95% 88%–100%)",
      "hit@5_text": "100.0% (27/27; KTC95% 88%–100%)",
      "mrr": 1.0,
      "time_mean": 4.143,
      "time_max": 4.828
    },
    "150": {
      "n": 19,
      "n_unique_queries": 18,
      "hit@1": 1.0,
      "hit@5": 1.0,
      "hit@1_text": "100.0% (19/19; KTC95% 83%–100%)",
      "hit@5_text": "100.0% (19/19; KTC95% 83%–100%)",
      "mrr": 1.0,
      "time_mean": 8.852,
      "time_max": 15.218
    },
    "300": {
      "n": 29,
      "n_unique_queries": 26,
      "hit@1": 0.9655,
      "hit@5": 0.9655,
      "hit@1_text": "96.6% (28/29; KTC95% 83%–99%)",
      "hit@5_text": "96.6% (28/2
```

## Semantic Search (đáp án chuẩn)

```json
{
  "generated_at": "2026-11-11T10:53:40",
  "reference_status": {
    "state": "APPROVED",
    "reviewers": [
      "Bùi Khánh Toàn",
      "Nguyễn Hoàng Phú"
    ],
    "approved_at": "2026-11-11T10:24:31",
    "cases": 69
  },
  "code_version": "42b8e0d",
  "overall": {
    "n": 12,
    "n_unique_queries": 12,
    "hit@1": 1.0,
    "hit@5": 1.0,
    "hit@1_text": "100.0% (12/12; KTC95% 76%–100%)",
    "hit@5_text": "100.0% (12/12; KTC95% 76%–100%)",
    "mrr": 1.0,
    "time_mean": 2.439,
    "time_max": 2.654
  },
  "cross_lingual": {
    "n": 5,
    "n_unique_queries": 5,
    "hit@1": 1.0,
    "hit@5": 1.0,
    "hit@1_text": "100.0% (5/5; KTC95% 57%–100%)",
    "hit@5_text": "100.0% (5/5; KTC95% 57%–100%)",
    "mrr": 1.0,
    "time_mean": 2.465,
    "time_max": 2.654
  },
  "same_language": {
    "n": 7,
    "n_unique_queries": 7,
    "hit@1": 1.0,
    "hit@5": 1.0,
    "hit@1_text": "100.0% (7/7; KTC95% 65%–100%)",
    "hit@5_text": "100.0% (7/7; KTC95% 65%–100%)",
    "mrr": 1.0,
    "time_mean": 2.421,
    "time_max": 2.541
  },
  "recall@5": 1.0,
  "failures_top5": []
}
```

## Ngưỡng similarity

```json
{
  "generated_at": "2026-11-11T10:54:42",
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
