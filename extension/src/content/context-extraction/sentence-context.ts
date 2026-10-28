/**
 * Tách block thành các câu, lấy câu trước + câu chứa selection + câu sau.
 */
export function getSentenceContext(blockText: string, selectionText: string): string {
  // Regex tách câu cơ bản (dấu chấm, chấm hỏi, chấm than, giữ lại dấu)
  const sentences = blockText.match(/[^.!?]+[.!?]*/g) || [blockText];
  
  let selIndex = -1;
  for (let i = 0; i < sentences.length; i++) {
    if (sentences[i].includes(selectionText)) {
      selIndex = i;
      break;
    }
  }

  if (selIndex === -1) return selectionText; // Không tìm thấy câu chứa selection

  const prev = selIndex > 0 ? sentences[selIndex - 1].trim() : "";
  const curr = sentences[selIndex].trim();
  const next = selIndex < sentences.length - 1 ? sentences[selIndex + 1].trim() : "";

  return [prev, curr, next].filter(Boolean).join(" ");
}