import { chunkMap } from "./chunk-mapper";

export function extractPageText(): { chunkId: string, text: string }[] {
  // Quét rộng hơn: thêm cả div, span nếu chúng chứa text
  const tags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "td", "article", "div"];
  const elements = document.querySelectorAll(tags.join(","));
  const chunks: { chunkId: string, text: string }[] = [];

  for (let i = 0; i < elements.length; i++) {
    if (chunks.length >= 300) break; // Giới hạn 300 block

    const el = elements[i] as HTMLElement;
    const text = (el.textContent || "").trim();
    
    // 1. Nới lỏng độ dài: Chỉ cần trên 5 ký tự là lấy (thay vì 20)
    if (text.length < 5) continue;
    
    // 2. Bỏ qua các thẻ div lồng nhau (chỉ lấy div cha ngoài cùng chứa text)
    if (el.tagName.toLowerCase() === "div" && el.querySelector("p, div, li, h1, h2, h3")) {
        continue;
    }

    // 3. Chỉ lọc các phần tử thực sự bị ẩn (display: none)
    if (el.offsetParent === null && el.tagName.toLowerCase() !== "body") {
        continue;
    }

    const chunkId = crypto.randomUUID();
    chunks.push({ chunkId, text });
    
    // Lưu vào Map để sau này Highlight
    chunkMap.set(chunkId, el);
  }

  console.log(`[Page Text Extractor] Đã tìm thấy ${chunks.length} đoạn văn bản trên trang.`);
  return chunks;
}