import { chunkMap } from "./chunk-mapper";

export function highlightChunk(chunkId: string, fallbackText?: string) {
  let el = chunkMap.get(chunkId);

  
  let currentLang: "vi" | "en" = "vi";
  chrome.storage.local.get(["language"], (res) => { if (res.language) currentLang = res.language; });
  chrome.storage.onChanged.addListener((changes) => { if (changes.language) currentLang = changes.language.newValue; });
    
  // Nếu không tìm thấy element trong Map (do DOM bị render lại)
  if (!el && fallbackText) {
    // Tìm thẻ <p>, <div>... có chứa đoạn text đó
    const allBlocks = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, td");
    for (const block of Array.from(allBlocks)) {
      if ((block.textContent || "").includes(fallbackText.substring(0, 50))) {
        el = block as HTMLElement;
        break;
      }
    }
  }

  if (!el) {
    const copyMsg = currentLang === "vi"
        ? "Không thể tìm thấy vị trí đoạn văn này trên trang (Trang có thể đã thay đổi)."
        : "The location of this passage could not be found on the page (the page may have changed).";
      alert(copyMsg);
    return;
  }

  document.querySelectorAll(".caa-highlight").forEach((node) => {
    (node as HTMLElement).style.backgroundColor = "";
    node.classList.remove("caa-highlight");
  });

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.transition = "background-color 0.3s";
  el.style.backgroundColor = "#fef08a";
  el.classList.add("caa-highlight");
}