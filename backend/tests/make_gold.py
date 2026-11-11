import json
from pathlib import Path
G = Path(__file__).resolve().parent / "gold"
G.mkdir(exist_ok=True)
HEAD = {"version": 1, "author": "BẢN NHÁP do trợ lý AI soạn tay. CHƯA có người duyệt. Phải được 2 thành viên đối chiếu từng ca (python gold_tool.py sheet) rồi mới chốt (python gold_tool.py freeze).",
        "rule": "Tuyệt đối không sửa file này để 'cho test qua'. Sửa là mất dấu chốt (hash đổi) và kết quả sẽ bị đánh dấu TAMPERED."}

def dump(name, cases):
    (G / name).write_text(json.dumps({**HEAD, "cases": cases}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(name, len(cases))

gram = [
 ("vi","mất dấu","Hom nay toi di lam bang xe may.","Hôm nay tôi đi làm bằng xe máy.",[]),
 ("vi","chính tả","Chúng em xin chân thành cảm ơn thầy cô đã tận tình giúp đở.","Chúng em xin chân thành cảm ơn thầy cô đã tận tình giúp đỡ.",[]),
 ("vi","chính tả","Bạn hãy xắp xếp lại các tài liệu theo thứ tự.","Bạn hãy sắp xếp lại các tài liệu theo thứ tự.",[]),
 ("vi","lặp từ","Em đã đã nộp bài tập vào hôm qua.","Em đã nộp bài tập vào hôm qua.",[]),
 ("vi","lặp từ","Chúng tôi sẽ sẽ tổ chức buổi họp vào thứ Hai.","Chúng tôi sẽ tổ chức buổi họp vào thứ Hai.",[]),
 ("vi","dính từ","Hãy kiểm tra lạiphần cài đặt của ứng dụng.","Hãy kiểm tra lại phần cài đặt của ứng dụng.",[]),
 ("vi","chính tả","Báo cáo vẫn còn nhiều thiếu xót.","Báo cáo vẫn còn nhiều thiếu sót.",[]),
 ("vi","không có lỗi","Cô ấy đã hoàn thành báo cáo trước hạn nộp.","Cô ấy đã hoàn thành báo cáo trước hạn nộp.",[]),
 ("vi","không có lỗi","Mô hình được huấn luyện trên tập dữ liệu rất lớn.","Mô hình được huấn luyện trên tập dữ liệu rất lớn.",[]),
 ("en","chia động từ","She don't like coffee in the morning.","She doesn't like coffee in the morning.",["She does not like coffee in the morning."]),
 ("en","chia động từ","He have two brothers and one sister.","He has two brothers and one sister.",[]),
 ("en","chia động từ","The results is shown in the table below.","The results are shown in the table below.",["The result is shown in the table below."]),
 ("en","chính tả","We recieved your message yesterday.","We received your message yesterday.",[]),
 ("en","chia động từ","There is many students in the classroom.","There are many students in the classroom.",[]),
 ("en","nhầm từ","Their going to submit the assignment tomorrow.","They're going to submit the assignment tomorrow.",["They are going to submit the assignment tomorrow."]),
 ("en","nhiều lỗi","The teacher explain the lesson very clear.","The teacher explained the lesson very clearly.",["The teacher explains the lesson very clearly."]),
 ("en","dạng động từ","I am looking forward to hear from you.","I am looking forward to hearing from you.",[]),
 ("en","không có lỗi","The meeting starts at nine o'clock tomorrow morning.","The meeting starts at nine o'clock tomorrow morning.",[]),
 ("en","không có lỗi","Please send me the final version of the document.","Please send me the final version of the document.",[]),
]
dump("grammar_gold.json", [{"id": f"g-gram-{i+1:02d}", "language": l, "error_type": e, "text": t, "expected": x, "alternatives": a, "context": ""} for i,(l,e,t,x,a) in enumerate(gram)])

def ex(i, text, ctx, lang, variant, meaning, expl, inc, exc=None):
    return {"id": f"g-exp-{i:02d}", "variant": variant, "text": text, "context": ctx, "language": lang,
            "reference": {"meaning": meaning, "explanation": expl}, "must_include": inc, "must_not_include": exc or []}
dump("explain_gold.json", [
 ex(1,"overfitting","Mô hình bị overfitting khi chỉ học thuộc dữ liệu huấn luyện.","vi","thuật ngữ kỹ thuật","Hiện tượng mô hình học quá khớp với dữ liệu huấn luyện nên dự đoán kém trên dữ liệu mới.","Mô hình ghi nhớ cả nhiễu của tập huấn luyện thay vì học quy luật chung.",[["huấn luyện","training","train"],["dữ liệu mới","chưa từng thấy","tổng quát","dữ liệu khác"]]),
 ex(2,"bank","We sat on the bank of the river and watched the boats.","vi","từ đa nghĩa: bờ sông","Bờ sông.","Trong câu này bank là bờ sông, nơi họ ngồi xem thuyền.",[["bờ"],["sông"]]),
 ex(3,"bank","She deposited her salary at the bank near her office.","vi","từ đa nghĩa: ngân hàng","Ngân hàng.","Trong câu này bank là ngân hàng, nơi cô ấy gửi lương.",[["ngân hàng"]]),
 ex(4,"latency","High latency makes the app feel slow even on a fast network.","en","thuật ngữ, trả lời tiếng Anh","The delay between sending a request and receiving a response.","High latency means each request takes long to come back, so the app feels slow.",[["delay","time","wait","lag"],["request","response","network","slow"]]),
 ex(5,"quang hợp","Quang hợp là quá trình cây xanh tạo ra đường và oxy từ ánh sáng, nước và CO2.","vi","khái niệm khoa học","Quá trình cây xanh dùng ánh sáng để tạo ra chất hữu cơ và oxy.","Cây hấp thụ ánh sáng, nước và CO2 để tạo ra đường và giải phóng oxy.",[["ánh sáng","năng lượng"],["oxy","đường"]]),
 ex(6,"inflation","Rising inflation reduces what each dollar can buy.","en","khái niệm kinh tế","A general rise in prices that lowers the purchasing power of money.","When prices rise, the same amount of money buys fewer goods.",[["price","prices"],["buy","purchasing","afford","value"]]),
 ex(7,"cache","A cache stores recent results so the page loads faster.","vi","ngữ cảnh tiếng Anh, trả lời tiếng Việt","Bộ nhớ đệm lưu tạm dữ liệu vừa dùng.","Cache lưu kết quả gần đây để lần sau lấy nhanh hơn, giúp trang tải nhanh.",[["lưu","bộ nhớ","nhớ tạm"],["nhanh","tốc độ","tải"]]),
 ex(8,"Apple","Apple released a new phone this autumn.","en","từ đa nghĩa: công ty","The technology company Apple Inc.","Here Apple is the company that makes phones, not the fruit.",[["company","tech","technology","brand","manufacturer","corporation"]]),
])

def rw(i, lang, mode, text, ref, keep, bad=None, length="câu"):
    return {"id": f"g-rew-{i:02d}", "language": lang, "mode": mode, "text": text, "context": "", "length": length,
            "reference": ref, "must_keep": keep, "must_not_contain": bad or []}
dump("rewrite_gold.json", [
 rw(1,"vi","formal","Mai họp lúc 9 giờ nha, mọi người nhớ đến sớm ở phòng 301 nhé.","Cuộc họp diễn ra lúc 9 giờ ngày mai tại phòng 301, đề nghị mọi người có mặt đúng giờ.",["9","301"],["nha","nhé"]),
 rw(2,"vi","casual","Kính mời quý khách đến dự buổi hội thảo vào ngày 15 tháng 3 tại Hà Nội.","Mời bạn đến dự hội thảo ngày 15 tháng 3 ở Hà Nội nha.",["15","Hà Nội"],["kính mời","quý khách"]),
 rw(3,"en","academic","The AI thing got way better after they used 3 million training examples.","Model performance improved substantially after training on 3 million examples.",[["3 million","three million","3,000,000"]],["thing","way better"]),
 rw(4,"vi","shorten","Năm 2019, công ty đã mở rộng sang ba tỉnh mới, tuyển thêm hơn hai trăm nhân viên và đồng thời đầu tư vào một hệ thống quản lý kho hiện đại để tăng tốc độ giao hàng cho khách.","Năm 2019, công ty mở rộng sang ba tỉnh, tuyển thêm hơn hai trăm nhân viên và đầu tư hệ thống quản lý kho.",["2019"],length="đoạn"),
 rw(5,"en","shorten","In 2021 the university opened a new library that has more than ten thousand books, many quiet study rooms, and a large reading hall that students can use from early morning until late at night.","In 2021 the university opened a library with over ten thousand books and many study rooms.",["2021"],length="đoạn"),
 rw(6,"en","improve","Me and him goes to the market on 5 May.","He and I go to the market on 5 May.",[["5 May","May 5"]],["me and him goes"]),
])

H = [("c01","Năng lượng tái tạo là nguồn năng lượng được lấy từ những nguồn có thể tự phục hồi như ánh sáng mặt trời, gió và nước."),
("c02","Điện mặt trời hoạt động nhờ các tấm pin quang điện biến ánh sáng thành điện năng."),
("c03","Điện gió sử dụng các tua-bin lớn để biến động năng của gió thành điện, thường đặt ở vùng ven biển hoặc đồi núi."),
("c04","Thủy điện tạo ra điện từ dòng nước chảy qua đập, và là nguồn điện lớn nhất trong nhóm năng lượng tái tạo ở nhiều nước."),
("c05","Nhược điểm chính của điện mặt trời và điện gió là phụ thuộc thời tiết nên sản lượng không ổn định."),
("c06","Để khắc phục, nhiều nước đầu tư hệ thống pin lưu trữ để tích điện lúc dư và dùng lại khi thiếu."),
("c07","Việt Nam có số giờ nắng cao ở miền Trung và miền Nam, thuận lợi để phát triển điện mặt trời."),
("c08","Chi phí lắp đặt tấm pin đã giảm mạnh trong mười năm qua, giúp nhiều hộ gia đình tự lắp trên mái nhà."),
("c09","Năng lượng hạt nhân không thải khí nhà kính khi vận hành nhưng đặt ra vấn đề xử lý chất thải phóng xạ."),
("c10","Than đá và dầu mỏ vẫn chiếm tỉ trọng lớn trong sản xuất điện toàn cầu và là nguồn phát thải carbon chính."),
("c11","Hiệp định Paris kêu gọi các quốc gia giảm phát thải để hạn chế mức tăng nhiệt độ toàn cầu."),
("c12","Người tiêu dùng có thể tiết kiệm điện bằng cách dùng đèn LED và thiết bị tiết kiệm năng lượng.")]
E = [("d01","The immune system protects the body by recognizing and destroying germs such as bacteria and viruses."),
("d02","White blood cells patrol the bloodstream and attack anything that looks foreign."),
("d03","A vaccine contains a weakened or inactive part of a germ so the body can practice fighting it safely."),
("d04","After vaccination, the body produces antibodies and memory cells that remember the germ for years."),
("d05","Some vaccines need booster doses because protection can fade over time."),
("d06","Herd immunity occurs when enough people are immune that the disease cannot spread easily."),
("d07","Common side effects of vaccines include a sore arm, mild fever, and tiredness for a day or two."),
("d08","Serious allergic reactions to vaccines are very rare and are usually treated quickly at the clinic."),
("d09","Antibiotics kill bacteria but do not work against viruses such as the common cold or flu."),
("d10","Hand washing and wearing masks reduce the spread of respiratory infections."),
("d11","Children usually receive a schedule of vaccines starting from birth to protect them early."),
("d12","Researchers test new vaccines in several phases of clinical trials before approval.")]
def doc(did, lang, paras, qs):
    return {"docId": did, "language": lang, "chunks": [{"chunkId": i, "text": t} for i, t in paras],
            "queries": [{"id": f"{did}-q{k+1}", "query": q, "language": ql, "relevant": r} for k,(q,ql,r) in enumerate(qs)]}
dump("search_gold.json", [
 doc("vi_energy","vi",H,[("tấm pin biến nắng thành điện như thế nào","vi",["c02"]),("vì sao điện gió và điện mặt trời không ổn định","vi",["c05"]),("giải pháp để lưu điện khi dư thừa","vi",["c06"]),("which source is the biggest among renewable power","en",["c04"]),("nhà máy điện hạt nhân có vấn đề gì","vi",["c09"]),("how can households save electricity","en",["c12"])]),
 doc("en_vaccine","en",E,[("why do some shots need extra doses later","en",["d05"]),("tác dụng phụ thường gặp sau khi tiêm","vi",["d07"]),("kháng sinh có chữa được cúm không","vi",["d09"]),("how does the body remember a germ","en",["d04"]),("miễn dịch cộng đồng là gì","vi",["d06"]),("how are new vaccines checked for safety before approval","en",["d12"])]),
])

# ---------------------------------------------------------------- thí nghiệm CÓ và KHÔNG có ngữ cảnh
CHEAD = {"version": 1, "author": "BẢN NHÁP do trợ lý AI soạn tay. CHƯA có người duyệt (python gold_tool.py sheet / freeze).",
         "purpose": "Thí nghiệm chứng minh điểm khác biệt Context-Aware: cùng một từ đa nghĩa, chạy HAI lần (có ngữ cảnh / không ngữ cảnh) rồi so sánh.",
         "rule": "Không sửa file này để 'cho test qua'. Sửa là đổi hash và bị đánh dấu TAMPERED."}
CTX = [
 ("bank","en","vi","Ngữ cảnh: bờ sông","We sat on the bank of the river and watched the boats.",[["bờ"]],[],"Bờ sông.","Ở đây bank là bờ sông."),
 ("bank","en","vi","Ngữ cảnh: ngân hàng","She deposited her salary at the bank near her office.",[["ngân hàng"]],[],"Ngân hàng.","Ở đây bank là ngân hàng, nơi gửi tiền."),
 ("Apple","en","vi","Ngữ cảnh: công ty","Apple released a new phone this autumn.",[["công ty","hãng","tập đoàn"]],[],"Công ty công nghệ Apple.","Ở đây Apple là công ty sản xuất điện thoại."),
 ("apple","en","vi","Ngữ cảnh: quả táo","She ate a red apple for lunch.",[["quả","trái"],["táo"]],["iphone","công ty","hãng"],"Quả táo.","Ở đây apple là quả táo, trái cây."),
 ("Python","en","vi","Ngữ cảnh: ngôn ngữ lập trình","I wrote the script in Python and ran it on the server.",[["lập trình","ngôn ngữ"]],[],"Ngôn ngữ lập trình Python.","Ở đây Python là ngôn ngữ lập trình."),
 ("python","en","vi","Ngữ cảnh: con trăn","A python slowly wrapped around the branch.",[["rắn","trăn"]],[],"Con trăn.","Ở đây python là loài rắn lớn, con trăn."),
 ("Java","en","vi","Ngữ cảnh: cà phê","She drinks a cup of Java every morning.",[["cà phê"]],[],"Cà phê.","Java ở đây là cách gọi cà phê."),
 ("Java","en","vi","Ngữ cảnh: ngôn ngữ lập trình","He built the backend in Java.",[["lập trình","ngôn ngữ"]],[],"Ngôn ngữ lập trình Java.","Ở đây Java là ngôn ngữ lập trình."),
 ("cell","en","vi","Ngữ cảnh: phòng giam","The prisoner was moved to a different cell.",[["phòng giam","buồng giam","nhà tù","phòng tù"]],[],"Phòng giam.","Ở đây cell là phòng giam."),
 ("cell","en","vi","Ngữ cảnh: tế bào","Each cell contains a nucleus.",[["tế bào"]],[],"Tế bào.","Ở đây cell là tế bào sinh học."),
 ("spring","en","vi","Ngữ cảnh: lò xo","The spring in the pen broke.",[["lò xo"]],[],"Lò xo.","Ở đây spring là lò xo."),
 ("spring","en","vi","Ngữ cảnh: mùa xuân","Flowers bloom in spring.",[["mùa xuân","xuân"]],[],"Mùa xuân.","Ở đây spring là mùa xuân."),
 ("bat","en","vi","Ngữ cảnh: con dơi","A bat flew out of the cave at night.",[["dơi"]],[],"Con dơi.","Ở đây bat là con dơi."),
 ("bat","en","vi","Ngữ cảnh: gậy","He swung the bat and hit the ball.",[["gậy"]],[],"Cây gậy.","Ở đây bat là gậy đánh bóng."),
 ("virus","en","vi","Ngữ cảnh: máy tính","A virus infected her laptop.",[["máy tính","phần mềm độc hại","mã độc"]],[],"Phần mềm độc hại.","Ở đây virus là virus máy tính."),
 ("virus","en","vi","Ngữ cảnh: bệnh","The flu virus spreads through the air.",[["cúm","bệnh","cơ thể","sinh học"]],[],"Vi rút gây bệnh.","Ở đây virus là tác nhân gây bệnh cúm."),
 ("đường","vi","vi","Ngữ cảnh: chất ngọt","Cho thêm một thìa đường vào cà phê.",[["ngọt","gia vị"]],[],"Chất ngọt.","Ở đây đường là đường ăn."),
 ("đường","vi","vi","Ngữ cảnh: con đường","Xe chạy trên đường cao tốc.",[["con đường","lối đi","giao thông"]],[],"Con đường.","Ở đây đường là lối đi cho xe."),
 ("bàn","vi","vi","Ngữ cảnh: thảo luận","Cả nhóm ngồi bàn kế hoạch cho dự án.",[["thảo luận","trao đổi","bàn bạc"]],[],"Thảo luận.","Ở đây bàn là bàn bạc."),
 ("bàn","vi","vi","Ngữ cảnh: đồ vật","Cô ấy đặt cốc nước lên bàn.",[["đồ vật","đồ nội thất","vật dụng","mặt phẳng","cái bàn"]],[],"Cái bàn.","Ở đây bàn là đồ nội thất."),
 ("mạng","vi","vi","Ngữ cảnh: internet","Máy tính bị mất mạng nên không gửi được email.",[["internet","kết nối","mạng máy tính","mạng lưới"]],[],"Mạng internet.","Ở đây mạng là kết nối internet."),
 ("mạng","vi","vi","Ngữ cảnh: sinh mạng","Người lính đã hy sinh mạng sống để cứu đồng đội.",[["sinh mạng","tính mạng","sự sống","cuộc sống"]],[],"Tính mạng.","Ở đây mạng là sinh mạng."),
 ("chín","vi","vi","Ngữ cảnh: quả chín","Quả xoài đã chín vàng.",[["muồi","ăn được","trưởng thành","đủ độ"]],[],"Quả đã đủ độ, ăn được.","Ở đây chín là trạng thái quả đã chín muồi."),
 ("chín","vi","vi","Ngữ cảnh: số 9","Cô bé lên chín tuổi.",[["số 9","số chín","con số","9"]],[],"Số chín.","Ở đây chín là số 9."),
]
cases = []
for i, (term, ctx_lang, ans_lang, variant, ctx, must, notin, meaning, expl) in enumerate(CTX, 1):
    cases.append({"id": f"g-ctx-{i:02d}", "variant": "tiếng Anh đa nghĩa" if ctx_lang == "en" else "tiếng Việt đa nghĩa",
                  "sense": variant, "text": term, "context": ctx, "language": ans_lang,
                  "reference": {"meaning": meaning, "explanation": expl}, "must_include": must, "must_not_include": notin})
(G / "context_gold.json").write_text(json.dumps({**CHEAD, "cases": cases}, ensure_ascii=False, indent=1), encoding="utf-8")
print("context_gold.json", len(cases))
print("\nĐã tạo 5 file trong", G, "(bản NHÁP, cần 2 người duyệt: python gold_tool.py sheet)")