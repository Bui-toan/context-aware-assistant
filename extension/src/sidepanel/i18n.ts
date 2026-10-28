export const translations = {
  vi: {
    tab_explain: "Giải thích", tab_search: "Tìm kiếm", tab_grammar: "Ngữ pháp", tab_rewrite: "Viết lại",
    search_placeholder: "Nhập câu hỏi tìm kiếm...", search_btn: "Tìm", search_found: "Tìm thấy", search_results: "kết quả:",
    grammar_title: "Kiểm tra ngữ pháp", grammar_input: "Nhập hoặc dán văn bản cần kiểm tra...", grammar_btn: "Check",
    grammar_original: "Văn bản gốc:", grammar_suggested: "Đề xuất sửa:",
    rewrite_title: "Viết lại văn bản", rewrite_input: "Nhập hoặc dán văn bản cần viết lại...", rewrite_btn: "Viết lại đoạn văn này",
    rewrite_result: "Kết quả:", btn_apply: "Thay thế văn bản", btn_copy: "Sao chép",
    loading: "Đang xử lý...", empty_explain: "Bôi đen văn bản để giải thích.",
    mode_formal: "Trang trọng", mode_casual: "Thân mật", mode_academic: "Học thuật", mode_shorten: "Rút gọn", mode_improve: "Cải thiện",
    // Thêm từ khóa cho Explain
    explain_input: "Nhập từ hoặc đoạn văn cần giải thích...",
    explain_btn: "Giải thích",
    explain_meaning: "Ý nghĩa",
    explain_explanation: "Giải thích chi tiết",
    explain_examples: "Ví dụ",
    settings_title: "Cài đặt",
    settings_lang: "Ngôn ngữ trả lời",
    settings_theme: "Giao diện tối",
    settings_save: "Lưu cài đặt",
    settings_saved: "Đã lưu thành công!",
    error_limit_exceeded: "Văn bản vượt quá giới hạn cho phép!"
  },
  en: {
    tab_explain: "Explain", tab_search: "Search", tab_grammar: "Grammar", tab_rewrite: "Rewrite",
    search_placeholder: "Enter search query...", search_btn: "Search", search_found: "Found", search_results: "results:",
    grammar_title: "Grammar Check", grammar_input: "Type or paste text to check...", grammar_btn: "Check",
    grammar_original: "Original:", grammar_suggested: "Suggested:",
    rewrite_title: "Rewrite Text", rewrite_input: "Type or paste text to rewrite...", rewrite_btn: "Rewrite this text",
    rewrite_result: "Result:", btn_apply: "Apply", btn_copy: "Copy",
    loading: "Processing...", empty_explain: "Select text to explain.",
    mode_formal: "Formal", mode_casual: "Casual", mode_academic: "Academic", mode_shorten: "Shorten", mode_improve: "Improve",
    // Thêm từ khóa cho Explain
    explain_input: "Type a word or paragraph to explain...",
    explain_btn: "Explain",
    explain_meaning: "Meaning",
    explain_explanation: "Detailed Explanation",
    explain_examples: "Examples",
    settings_title: "Settings",
    settings_lang: "Response Language",
    settings_theme: "Dark Mode",
    settings_save: "Save Settings",
    settings_saved: "Saved successfully!",
     error_limit_exceeded: "Text exceeds the allowed limit!"
  }
};
export type Lang = "vi" | "en";