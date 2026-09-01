import { AnswerVerificationResult } from "@/types/chat";

// Kiểm tra các dấu hiệu vi phạm phương pháp lớp 8 hoặc lộ thông tin cấm
const FORBIDDEN_IN_ANSWER = [
  "system prompt",
  "bạn là một ai",
  "dùng định lý fermat",
  "đạo hàm bậc",
  "tích phân từng phần",
  "ma trận",
  "giải tích",
];

export function runAnswerVerifier(
  draftAnswer: string,
  question: string
): AnswerVerificationResult {
  const lower = draftAnswer.toLowerCase();

  let scope_ok = true;
  let calculation_ok = true;
  let formula_ok = true;
  let logic_ok = true;
  let grade8_method = true;
  let citation_ok = true;
  let source_supported = true;
  let needs_regeneration = false;
  let feedback = "";

  // 1. Kiểm tra từ khóa cấm hoặc rò rỉ prompt
  for (const forbidden of FORBIDDEN_IN_ANSWER) {
    if (lower.includes(forbidden)) {
      scope_ok = false;
      grade8_method = false;
      needs_regeneration = true;
      feedback += `Phát hiện nội dung ngoài phạm vi hoặc từ khóa cấm: ${forbidden}. `;
    }
  }

  // 2. Kiểm tra định dạng công thức: Nếu có công thức phức tạp chưa bọc LaTeX
  if (draftAnswer.includes("A^2 + 2AB + B^2") && !draftAnswer.includes("\\(") && !draftAnswer.includes("\\[")) {
    formula_ok = false;
    feedback += "Cần bọc các công thức toán học trong ký hiệu LaTeX \\( ... \\) hoặc \\[ ... \\]. ";
  }

  // 3. Kiểm tra độ dài và tính đầy đủ
  if (draftAnswer.trim().length < 20) {
    logic_ok = false;
    needs_regeneration = true;
    feedback += "Câu trả lời quá ngắn, chưa đủ chi tiết để học sinh hiểu. ";
  }

  return {
    scope_ok,
    source_supported,
    calculation_ok,
    formula_ok,
    logic_ok,
    grade8_method,
    citation_ok,
    needs_regeneration,
    feedback: feedback.trim() || undefined,
  };
}
