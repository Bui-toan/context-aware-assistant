import { chunkMap } from "./chunk-mapper";

export function extractPageText(): { chunkId: string, text: string }[] {
  // Các thẻ chứa text quan trọng
  const tags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "td"];
  const elements = document.querySelectorAll(tags.join(","));
  const chunks: { chunkId: string, text: string }[] = [];

  // Giới hạn 300 block để không bị treo trình duyệt (MAX_BLOCKS)
  for (let i = 0; i < elements.length; i++) {
    if (chunks.length >= 300) break;

    const el = elements[i] as HTMLElement;
    const text = (el.textContent || "").trim();
    
    // Lọc rỗng hoặc quá ngắn
    if (text.length < 20) continue;
    
    // Lọc phần tử bị ẩn
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const chunkId = crypto.randomUUID();
    chunks.push({ chunkId, text });
    
    // Lưu vào Map để sau này Highlight
    chunkMap.set(chunkId, el);
  }

  return chunks;
}