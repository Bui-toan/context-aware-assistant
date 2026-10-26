import { chunkMap } from "./chunk-mapper";

export function highlightChunk(chunkId: string) {
  const el = chunkMap.get(chunkId);
  
  if (!el) {
    console.warn("[Highlighter] Không tìm thấy element cho chunkId:", chunkId);
    return;
  }

  // 1. Xóa highlight cũ (nếu có) để không bị tô vàng nhiều đoạn cùng lúc
  document.querySelectorAll(".caa-highlight").forEach((node) => {
    const htmlNode = node as HTMLElement;
    htmlNode.style.backgroundColor = "";
    htmlNode.classList.remove("caa-highlight");
  });

  // 2. Cuộn trang mượt mà tới vị trí đoạn văn
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  
  // 3. Tô màu vàng nhạt
  el.style.transition = "background-color 0.3s";
  el.style.backgroundColor = "#fef08a"; // Màu vàng nhạt (Tailwind yellow-200)
  el.classList.add("caa-highlight");
}