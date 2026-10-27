import type { translations, Lang } from "../i18n";

export type Dict = (typeof translations)[Lang];

export interface BaseViewProps {
  loading?: boolean;
  error?: string | null;
  currentQueryText?: string; // đoạn/từ khóa đang xử lý, để hiện "Đang phân tích ..."
  t: Dict;
}