import { describe, it, expect, beforeEach } from "vitest";
import { extractContext } from "../../src/content/context-extraction";
import { findContextCandidates } from "../../src/content/context-extraction/candidate-finder";

describe("Context Extraction Engine", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("Trích xuất đúng câu chứa selection và câu xung quanh", () => {
    document.body.innerHTML = `<p id="p1">Câu một. Đây là câu hai. Câu ba.</p>`;
    const p = document.getElementById("p1")!;
    
    const context = extractContext(p.firstChild, "Đây là câu hai.");
    expect(context).toBe("Câu một. Đây là câu hai. Câu ba.");
  });

  it("Cắt bớt nếu context dài quá 500 ký tự", () => {
    const longText = "Câu này rất dài. ".repeat(50); // > 500
    document.body.innerHTML = `<p id="p1">${longText}</p>`;
    const p = document.getElementById("p1")!;
    
    const context = extractContext(p.firstChild, "Câu này rất dài.");
    expect(context.length).toBeLessThanOrEqual(504); // 500 + "..."
  });

  it("Trả về đúng text bôi đen nếu không tìm thấy block cha (Fallback)", () => {
    const orphanNode = document.createTextNode("text mồ côi");
    const context = extractContext(orphanNode, "text mồ côi");
    expect(context).toBe("text mồ côi");
  });
  
  it("Tìm đúng candidate cha", () => {
    document.body.innerHTML = `<div><p id="p1">Test</p></div>`;
    const candidates = findContextCandidates(document.getElementById("p1")!.firstChild);
    expect(candidates[0].tagName).toBe("p");
  });
});