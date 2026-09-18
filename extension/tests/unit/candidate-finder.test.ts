import { describe, it, expect, beforeEach } from "vitest";
import { findContextCandidates, findNearestCandidate } from "../../src/content/context-extraction/candidate-finder";

describe("candidate-finder", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("tìm được paragraph từ text node", () => {
    document.body.innerHTML = `<p id="p1">Đây là đoạn văn mẫu.</p>`;
    const p = document.getElementById("p1")!;
    const textNode = p.firstChild!;

    const candidates = findContextCandidates(textNode);
    expect(candidates.length).toBe(1);
    expect(candidates[0].tagName).toBe("p");
    expect(candidates[0].priority).toBe(0);
    expect(candidates[0].distance).toBe(1); // text → p
  });

  it("trả về nhiều candidates khi có nesting", () => {
    document.body.innerHTML = `
      <article id="a1">
        <p id="p1">Đoạn văn bên trong article.</p>
      </article>
    `;
    const p = document.getElementById("p1")!;
    const textNode = p.firstChild!;

    const candidates = findContextCandidates(textNode);
    // text → p → article → body (body không có trong PRIORITY_TAGS)
    expect(candidates.length).toBe(2);
    expect(candidates[0].tagName).toBe("p");
    expect(candidates[1].tagName).toBe("article");
    expect(candidates[0].distance).toBeLessThan(candidates[1].distance);
  });

  it("tìm được li trong ul", () => {
    document.body.innerHTML = `
      <ul><li id="li1">Mục 1 trong danh sách.</li></ul>
    `;
    const li = document.getElementById("li1")!;
    const textNode = li.firstChild!;

    const candidates = findContextCandidates(textNode);
    expect(candidates[0].tagName).toBe("li");
    expect(candidates[0].priority).toBe(1);
  });

  it("tìm được td trong table", () => {
    document.body.innerHTML = `
      <table><tbody><tr><td id="td1">Ô trong bảng.</td></tr></tbody></table>
    `;
    const td = document.getElementById("td1")!;
    const textNode = td.firstChild!;

    const candidates = findContextCandidates(textNode);
    expect(candidates[0].tagName).toBe("td");
  });

  it("div là fallback khi không có block ngữ nghĩa", () => {
    document.body.innerHTML = `
      <div id="d1"><span>Text trong div lồng span.</span></div>
    `;
    const span = document.querySelector("span")!;
    const textNode = span.firstChild!;

    const candidates = findContextCandidates(textNode);
    expect(candidates[0].tagName).toBe("div");
    expect(candidates[0].priority).toBe(7); // div là index cuối
  });

  it("trả về mảng rỗng nếu node đứng ngoài document", () => {
    const orphan = document.createTextNode("cô đơn");
    const candidates = findContextCandidates(orphan);
    expect(candidates.length).toBe(0);
  });

  it("findNearestCandidate trả về candidate đầu tiên", () => {
    document.body.innerHTML = `<p id="p1">Một đoạn văn.</p>`;
    const p = document.getElementById("p1")!;
    const nearest = findNearestCandidate(p.firstChild!);
    expect(nearest).not.toBeNull();
    expect(nearest!.tagName).toBe("p");
  });
});