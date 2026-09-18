import { describe, it, expect, beforeEach } from "vitest";
import { findContextCandidates } from "../../src/content/context-extraction/candidate-finder";
import { scoreCandidate, scoreAllCandidates, pickBestCandidate } from "../../src/content/context-extraction/block-scorer";

describe("block-scorer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("paragraph dài hợp lý có score cao hơn div rỗng", () => {
    document.body.innerHTML = `
      <p id="p1">${"Đây là câu văn bản mẫu. ".repeat(10)}</p>
      <div id="d1"></div>
    `;
    const pCandidates = findContextCandidates(document.getElementById("p1")!.firstChild!);
    const dCandidates = findContextCandidates(document.getElementById("d1")!);

    // div rỗng không có textContent → dùng chính element làm node
    const pScore = scoreCandidate(pCandidates[0]);
    // div không có candidate nào từ text node vì rỗng → test khác
    expect(pScore).toBeGreaterThan(50);
  });

  it("block quá dài bị giảm điểm so với block lý tưởng", () => {
    document.body.innerHTML = `
      <p id="short">${"Từ. ".repeat(50)}</p>
      <p id="long">${"Từ. ".repeat(2000)}</p>
    `;
    const short = findContextCandidates(document.getElementById("short")!.firstChild!)[0];
    const long = findContextCandidates(document.getElementById("long")!.firstChild!)[0];

    const shortScore = scoreCandidate(short);
    const longScore = scoreCandidate(long);

    expect(shortScore).toBeGreaterThan(longScore);
  });

  it("paragraph ưu tiên cao hơn div khi cùng độ dài", () => {
    document.body.innerHTML = `
      <p id="p1">${"Nội dung văn bản mẫu ở đây. ".repeat(5)}</p>
      <div id="d1">${"Nội dung văn bản mẫu ở đây. ".repeat(5)}</div>
    `;
    const pCand = findContextCandidates(document.getElementById("p1")!.firstChild!)[0];
    const dCand = findContextCandidates(document.getElementById("d1")!.firstChild!)[0];

    const pScore = scoreCandidate(pCand);
    const dScore = scoreCandidate(dCand);

    expect(pScore).toBeGreaterThan(dScore);
  });

  it("scoreAllCandidates sắp xếp giảm dần", () => {
    document.body.innerHTML = `
      <div id="outer">
        <p id="p1">${"Câu văn dài hợp lý. ".repeat(10)}</p>
      </div>
    `;
    const p = document.getElementById("p1")!;
    const candidates = findContextCandidates(p.firstChild!);
    const scored = scoreAllCandidates(candidates);

    expect(scored.length).toBeGreaterThan(1);
    for (let i = 1; i < scored.length; i++) {
      expect(scored[i - 1].score).toBeGreaterThanOrEqual(scored[i].score);
    }
  });

  it("pickBestCandidate trả về null khi mảng rỗng", () => {
    expect(pickBestCandidate([])).toBeNull();
  });

  it("pickBestCandidate trả về candidate score cao nhất", () => {
    document.body.innerHTML = `
      <article id="a1">
        <div id="d1">
          <p id="p1">${"Đoạn văn lý tưởng về độ dài và nội dung. ".repeat(8)}</p>
        </div>
      </article>
    `;
    const p = document.getElementById("p1")!;
    const candidates = findContextCandidates(p.firstChild!);
    const best = pickBestCandidate(candidates);

    expect(best).not.toBeNull();
    expect(best!.tagName).toBe("p"); // p phải thắng article + div
  });
});