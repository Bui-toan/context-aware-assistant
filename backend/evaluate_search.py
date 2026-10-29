"""Đánh giá Semantic Search.
Chạy: python eval_search.py [--url http://localhost:8000/api/search] [--limit 40] [--seed 42]
"""
import argparse
import json
import random
import statistics
import time
from collections import defaultdict

import requests

# (lĩnh vực, đoạn VI, đoạn EN, query VI, query EN, query ngắn)
T = [
    ("geo", "Nhật Bản là quốc đảo nằm ở Đông Á, nổi tiếng với mùa hoa anh đào nở vào mùa xuân.",
     "Japan is an island country in East Asia, famous for cherry blossoms that bloom in spring.",
     "đất nước nào nổi tiếng với hoa anh đào", "which country is known for cherry blossoms", "hoa anh đào"),
    ("geo", "Ai Cập cổ đại xây dựng các kim tự tháp khổng lồ bên bờ sông Nile để làm lăng mộ cho các pharaoh.",
     "Ancient Egypt built giant pyramids beside the Nile River as tombs for the pharaohs.",
     "ai đã xây kim tự tháp làm mộ cho vua", "who built the pyramids as tombs for kings", "kim tự tháp"),
    ("geo", "Hà Nội là thủ đô của Việt Nam, nằm bên bờ sông Hồng và có lịch sử hơn một nghìn năm.",
     "Hanoi is the capital of Vietnam, located on the Red River with more than a thousand years of history.",
     "thủ đô của nước Việt Nam là thành phố nào", "what is the capital city of Vietnam", "thủ đô"),
    ("geo", "Rừng Amazon ở Nam Mỹ là khu rừng nhiệt đới lớn nhất thế giới và có đa dạng sinh học rất cao.",
     "The Amazon rainforest in South America is the largest tropical forest in the world with very high biodiversity.",
     "khu rừng nhiệt đới lớn nhất hành tinh", "largest rainforest on Earth", "rừng nhiệt đới"),
    ("sci", "Học máy là một nhánh của trí tuệ nhân tạo, cho phép máy tính học từ dữ liệu mà không cần lập trình chi tiết.",
     "Machine learning is a branch of artificial intelligence that lets computers learn from data without explicit programming.",
     "máy tính tự học từ dữ liệu nghĩa là gì", "how can computers learn from data", "học máy"),
    ("sci", "Lỗ đen là vùng không-thời gian có lực hấp dẫn mạnh đến mức ánh sáng cũng không thể thoát ra.",
     "A black hole is a region of spacetime where gravity is so strong that even light cannot escape.",
     "vùng vũ trụ nơi ánh sáng không thể thoát ra", "where gravity is so strong light cannot escape", "lỗ đen"),
    ("sci", "Quang hợp là quá trình cây xanh dùng ánh sáng mặt trời, nước và khí CO2 để tạo ra đường và oxy.",
     "Photosynthesis is the process by which green plants use sunlight, water and carbon dioxide to make sugar and oxygen.",
     "cây xanh tạo ra oxy bằng cách nào", "how do plants make oxygen from sunlight", "quang hợp"),
    ("sci", "Vắc-xin giúp cơ thể làm quen với mầm bệnh đã bị làm yếu để hệ miễn dịch sẵn sàng chống lại bệnh thật.",
     "Vaccines train the immune system with weakened germs so the body is ready to fight the real disease.",
     "tiêm phòng giúp cơ thể chống bệnh như thế nào", "how do vaccines protect against disease", "vắc-xin"),
    ("sci", "Blockchain là sổ cái phân tán, trong đó các khối dữ liệu được liên kết bằng mã hóa nên rất khó bị sửa đổi.",
     "A blockchain is a distributed ledger whose data blocks are linked by cryptography, making them very hard to alter.",
     "sổ cái phân tán khó bị giả mạo", "tamper-resistant distributed ledger", "blockchain"),
    ("food", "Phở là món súp truyền thống của Việt Nam gồm nước dùng, bánh phở, rau thơm và thịt bò hoặc gà.",
     "Pho is a traditional Vietnamese soup made of broth, rice noodles, fresh herbs and beef or chicken.",
     "món canh bánh phở của người Việt nấu từ gì", "what ingredients are in Vietnamese noodle soup", "món phở"),
    ("food", "Sushi là món ăn Nhật Bản làm từ cơm trộn giấm kết hợp với cá sống, hải sản hoặc rau củ.",
     "Sushi is a Japanese dish of vinegared rice combined with raw fish, seafood or vegetables.",
     "món cơm giấm cuộn cá sống của Nhật", "Japanese dish with vinegared rice and raw fish", "sushi"),
    ("food", "Cà phê được làm từ hạt cà phê rang xay, và Việt Nam là một trong những nước xuất khẩu cà phê lớn nhất thế giới.",
     "Coffee is made from roasted ground beans, and Vietnam is one of the largest coffee exporters in the world.",
     "nước nào xuất khẩu nhiều hạt cà phê", "which countries export the most coffee", "cà phê"),
    ("food", "Pizza là món bánh có nguồn gốc từ Ý, phủ sốt cà chua và phô mai rồi nướng trong lò.",
     "Pizza is a dish from Italy, topped with tomato sauce and cheese and baked in an oven.",
     "bánh nướng phủ phô mai và sốt cà chua có xuất xứ ở đâu", "where does cheese and tomato pizza come from", "pizza"),
    ("hist", "Chiến tranh thế giới thứ hai diễn ra từ năm 1939 đến 1945 và kết thúc với sự đầu hàng của phe Trục.",
     "World War II lasted from 1939 to 1945 and ended with the surrender of the Axis powers.",
     "cuộc chiến toàn cầu kết thúc năm 1945", "when did the second world war end", "chiến tranh thế giới"),
    ("hist", "Tổng thống Hoa Kỳ vừa là nguyên thủ quốc gia vừa là người đứng đầu chính phủ Mỹ.",
     "The President of the United States is both the head of state and the head of government.",
     "ai đứng đầu chính phủ nước Mỹ", "who leads the American government", "tổng thống Mỹ"),
    ("hist", "Cách mạng công nghiệp bắt đầu ở Anh vào thế kỷ 18, thay lao động thủ công bằng máy móc chạy bằng hơi nước.",
     "The Industrial Revolution began in Britain in the 18th century, replacing manual labor with steam-powered machines.",
     "máy hơi nước thay thế sức người từ khi nào", "when did factories start using steam machines", "cách mạng công nghiệp"),
    ("hist", "Ngày 2 tháng 9 năm 1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình.",
     "On 2 September 1945, President Ho Chi Minh read the Declaration of Independence at Ba Dinh Square.",
     "lễ tuyên bố độc lập của Việt Nam diễn ra ở đâu", "where was Vietnam's independence declared", "Tuyên ngôn Độc lập"),
    ("nat", "Cá voi xanh là loài động vật lớn nhất từng tồn tại, có thể dài hơn ba mươi mét.",
     "The blue whale is the largest animal ever to have lived, reaching more than thirty meters in length.",
     "con vật khổng lồ nhất đại dương", "biggest animal in the ocean", "cá voi"),
    ("nat", "Đỉnh Everest cao khoảng 8.849 mét, là ngọn núi cao nhất thế giới so với mực nước biển.",
     "Mount Everest is about 8,849 meters tall, the highest mountain in the world above sea level.",
     "ngọn núi cao nhất hành tinh", "tallest mountain on earth", "Everest"),
    ("nat", "Biến đổi khí hậu khiến nhiệt độ Trái Đất tăng lên chủ yếu do khí nhà kính từ việc đốt nhiên liệu hóa thạch.",
     "Climate change is raising Earth's temperature mainly because of greenhouse gases from burning fossil fuels.",
     "vì sao trái đất nóng lên", "why is the planet getting warmer", "khí nhà kính"),
    ("nat", "Mặt Trăng là vệ tinh tự nhiên duy nhất của Trái Đất và gây ra hiện tượng thủy triều.",
     "The Moon is Earth's only natural satellite and causes the ocean tides.",
     "thiên thể nào làm nước biển lên xuống", "what causes ocean tides", "thủy triều"),
]

# Query KHÔNG có đáp án trong trang (để xem điểm của kết quả sai thấp đến đâu)
NEG = [
    "cách sửa phanh xe máy bị hỏng", "lịch thi đấu bóng đá hôm nay", "công thức tính lãi suất vay ngân hàng",
    "how to install Python on Windows", "giá vàng hôm nay bao nhiêu", "cách trồng cây cà chua trong chậu",
]

LANG_IDX = {"vi": 1, "en": 2}


def make_case(i, kind, query, lang, rng):
    dom = T[i][0]
    others = [j for j in range(len(T)) if j != i]
    hard = rng.sample([j for j in others if T[j][0] == dom], 2)  # nhiễu khó: cùng lĩnh vực
    rest = rng.sample([j for j in others if j not in hard], 12)  # nhiễu thường
    chunks = [{"chunkId": "target", "text": T[i][LANG_IDX[lang]]}]
    chunks += [{"chunkId": f"h{j}", "text": T[j][LANG_IDX[lang]]} for j in hard]
    chunks += [{"chunkId": f"r{j}", "text": T[j][LANG_IDX[rng.choice(['vi', 'en'])]]} for j in rest]
    rng.shuffle(chunks)
    return {"kind": kind, "query": query, "chunks": chunks, "has_answer": True}


def build_cases(rng):
    cases = []
    for i, (_, _, _, qv, qe, qs) in enumerate(T):
        for kind, q, lang in [("vi→vi", qv, "vi"), ("en→en", qe, "en"), ("vi→en", qv, "en"),
                              ("en→vi", qe, "vi"), ("ngắn vi→vi", qs, "vi")]:
            cases.append(make_case(i, kind, q, lang, rng))
    return cases


def build_negatives(rng):
    out = []
    for q in NEG:
        idx = rng.sample(range(len(T)), 15)
        chunks = [{"chunkId": f"r{j}", "text": T[j][LANG_IDX[rng.choice(['vi', 'en'])]]} for j in idx]
        out.append({"kind": "không có đáp án", "query": q, "chunks": chunks, "has_answer": False})
    return out


def call(url, case, top_k=10):
    t0 = time.time()
    r = requests.post(url, json={"query": case["query"], "chunks": case["chunks"], "topK": top_k}, timeout=120)
    return r, time.time() - t0


def summarize(title, rows):
    n = len(rows)
    if not n:
        return
    h1 = sum(r["rank"] == 1 for r in rows) / n
    h5 = sum(r["rank"] is not None and r["rank"] <= 5 for r in rows) / n
    mrr = sum(1 / r["rank"] if r["rank"] else 0 for r in rows) / n
    print(f"{title:<14} n={n:<4} Hit@1={h1:6.1%}  Hit@5={h5:6.1%}  MRR={mrr:.2f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8000/api/search")
    ap.add_argument("--limit", type=int, default=0, help="chỉ chạy N ca (0 = tất cả)")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    cases = build_cases(rng)
    if args.limit:
        cases = rng.sample(cases, min(args.limit, len(cases)))
    negs = build_negatives(rng)

    print("⏳ Gọi thử 1 lần để làm nóng model (không tính vào thời gian)...")
    try:
        call(args.url, cases[0])
    except requests.RequestException as e:
        print("❌ Không gọi được backend:", e)
        return

    rows, times, top_scores_pos, errors = [], [], [], 0
    for k, case in enumerate(cases, 1):
        resp, dt = call(args.url, case)
        if resp.status_code != 200:
            errors += 1
            print(f"❌ [{k}] HTTP {resp.status_code}: {case['query']}")
            continue
        results = resp.json().get("results", [])
        ids = [r["chunkId"] for r in results]
        rank = ids.index("target") + 1 if "target" in ids else None
        times.append(dt)
        if results and results[0].get("score") is not None:
            top_scores_pos.append(results[0]["score"])
        texts = {c["chunkId"]: c["text"] for c in case["chunks"]}
        rows.append({"kind": case["kind"], "query": case["query"], "rank": rank,
                     "target": texts["target"], "top3": [(r["chunkId"], r.get("score"), texts.get(r["chunkId"], "")) for r in results[:3]]})

    neg_scores = []
    for case in negs:
        resp, _ = call(args.url, case)
        if resp.status_code == 200:
            res = resp.json().get("results", [])
            if res and res[0].get("score") is not None:
                neg_scores.append(res[0]["score"])

    print("\n" + "=" * 64)
    print("📊 KẾT QUẢ ĐÁNH GIÁ SEMANTIC SEARCH")
    print("=" * 64)
    summarize("TẤT CẢ", rows)
    by_kind = defaultdict(list)
    for r in rows:
        by_kind[r["kind"]].append(r)
    for kind, rs in by_kind.items():
        summarize(kind, rs)

    if times:
        s = sorted(times)
        print(f"\nThời gian (đã bỏ lần làm nóng): TB={statistics.mean(times):.2f}s  "
              f"trung vị={statistics.median(times):.2f}s  p95={s[int(0.95 * (len(s) - 1))]:.2f}s  max={s[-1]:.2f}s")
    if errors:
        print(f"Số lần lỗi HTTP: {errors}")
    if top_scores_pos and neg_scores:
        print(f"\nĐiểm top-1 khi CÓ đáp án : TB={statistics.mean(top_scores_pos):.3f}")
        print(f"Điểm top-1 khi KHÔNG có  : TB={statistics.mean(neg_scores):.3f}  (khoảng cách càng lớn càng dễ đặt ngưỡng lọc)")

    fails = [r for r in rows if r["rank"] is None or r["rank"] > 1]
    print(f"\n❗ {len(fails)} ca không xếp hạng 1 (chi tiết lưu trong eval_report.json)")
    for r in fails[:15]:
        print(f"  - [{r['kind']}] '{r['query']}' → hạng {r['rank']}")
    with open("eval_report.json", "w", encoding="utf-8") as f:
        json.dump(fails, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()