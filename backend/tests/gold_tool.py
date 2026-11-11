"""QUY TRÌNH DUYỆT ĐÁP ÁN CHUẨN (gold) BỞI NGƯỜI THẬT.
  python gold_tool.py sheet     # xuất gold/review_sheet.csv: mỗi dòng một ca, 2 người duyệt ĐỘC LẬP điền OK hoặc SAI
  python gold_tool.py freeze    # nếu mọi ca đều có 2 người khác nhau chấm OK -> khóa bằng SHA-256 (gold/GOLD_MANIFEST.json)
  python gold_tool.py status    # xem trạng thái: DRAFT (chưa duyệt) | APPROVED (đã duyệt) | TAMPERED (bị sửa sau khi duyệt)
Sau khi freeze, MỌI chỉnh sửa file gold làm hash đổi -> kết quả test bị đánh dấu TAMPERED -> phải duyệt lại từ đầu.
"""
import csv
import sys

import common as C

FILES = ["grammar_gold.json", "explain_gold.json", "rewrite_gold.json", "search_gold.json", "context_gold.json"]
COLS = ["file", "id", "đầu_vào", "đáp_án_chuẩn_cần_kiểm_tra", "người_duyệt_1", "kết_quả_1 (OK/SAI)", "người_duyệt_2", "kết_quả_2 (OK/SAI)", "ghi_chú"]


def rows():
    for f in FILES:
        _, cases = C.load_gold(f)
        for c in cases:
            if f == "grammar_gold.json":
                alt = f" | cũng chấp nhận: {c['alternatives']}" if c["alternatives"] else ""
                yield [f, c["id"], f"[{c['language']}] {c['text']}", f"{c['expected']}{alt}"]
            elif f in ("explain_gold.json", "context_gold.json"):
                yield [f, c["id"], f"[{c['language']}] «{c['text']}» trong câu: {c['context']}",
                       f"Ý nghĩa: {c['reference']['meaning']} | Giải thích: {c['reference']['explanation']} | Phải nêu ý (mỗi nhóm một từ): {c['must_include']}"]
            elif f == "rewrite_gold.json":
                yield [f, c["id"], f"[{c['language']}, chế độ {c['mode']}] {c['text']}",
                       f"{c['reference']} | Phải giữ: {c['must_keep']} | Không được còn: {c['must_not_contain']}"]
            else:
                texts = {x["chunkId"]: x["text"] for x in c["chunks"]}
                for q in c["queries"]:
                    yield [f, q["id"], f"[{q['language']}] «{q['query']}» (trong tài liệu {c['docId']}: hãy đọc HẾT các đoạn)",
                           "Đoạn đúng: " + " || ".join(f"{i}: {texts[i]}" for i in q["relevant"]) + " | Kiểm tra: không còn đoạn nào khác cũng trả lời được?"]


def sheet():
    out = C.GOLD_DIR / "review_sheet.csv"
    with out.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(COLS)
        n = 0
        for r in rows():
            w.writerow(r + [""] * (len(COLS) - len(r)))
            n += 1
    print(f"✔ Đã xuất {n} dòng vào {out}\nHai người duyệt ĐỘC LẬP (không xem kết quả của nhau), mỗi người điền tên và OK/SAI. Dòng SAI: ghi rõ vào ghi_chú rồi sửa file gold và duyệt lại.")


def freeze():
    sheet_path = C.GOLD_DIR / "review_sheet.csv"
    if not sheet_path.exists():
        sys.exit("Chưa có review_sheet.csv. Chạy: python gold_tool.py sheet")
    expected = {(r[0], r[1]) for r in rows()}
    got, problems, names = {}, [], set()
    with sheet_path.open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            key = (r["file"], r["id"])
            n1, v1, n2, v2 = (r[COLS[4]] or "").strip(), (r[COLS[5]] or "").strip().upper(), (r[COLS[6]] or "").strip(), (r[COLS[7]] or "").strip().upper()
            got[key] = True
            if not n1 or not n2 or n1.lower() == n2.lower():
                problems.append(f"{key[1]}: cần 2 người duyệt KHÁC NHAU")
            elif v1 != "OK" or v2 != "OK":
                problems.append(f"{key[1]}: có người chấm '{v1 or '-'}'/'{v2 or '-'}' (cần cả hai OK)")
            names |= {n1, n2}
    problems += [f"{k[1]}: thiếu trong bảng duyệt" for k in expected - set(got)]
    problems += [f"{k[1]}: ca không còn tồn tại trong gold (bảng cũ)" for k in set(got) - expected]
    if problems:
        print(f"❌ Chưa thể chốt: {len(problems)} vấn đề")
        print("  - " + "\n  - ".join(problems[:25]))
        sys.exit(1)
    manifest = {"approved_at": C.now(), "reviewers": sorted(names - {""}), "cases": len(expected),
                "files": {f: C.sha256_file(C.GOLD_DIR / f) for f in FILES}, "review_sheet_sha256": C.sha256_file(sheet_path)}
    C.save_json(C.GOLD_DIR / "GOLD_MANIFEST.json", manifest)
    print(f"✔ ĐÃ CHỐT {len(expected)} ca, người duyệt: {', '.join(manifest['reviewers'])}. Từ giờ sửa file gold sẽ bị phát hiện (TAMPERED).")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "sheet":
        sheet()
    elif cmd == "freeze":
        freeze()
    else:
        print(C.gold_status())