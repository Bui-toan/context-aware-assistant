/**
 * Giới hạn độ dài context (SDS yêu cầu 500 ký tự).
 * Cắt bớt từ cuối lên nếu quá dài.
 */
export function limitContext(context: string, maxLength: number = 500): string {
  if (context.length <= maxLength) return context;
  return context.slice(0, maxLength).trim() + "...";
}