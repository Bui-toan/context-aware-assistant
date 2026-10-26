export const PRIORITY_TAGS = [
  "p", "li", "blockquote", "td", "th", "article", "section", "div"
] as const;

export interface ContextCandidate {
  element: HTMLElement;
  tagName: string;
  priority: number;
  distance: number;
}

export interface ScoredCandidate extends ContextCandidate {
  score: number;
}