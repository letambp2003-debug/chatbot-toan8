export interface InputGuardResult {
  isSafe: boolean;
  sanitizedText: string;
  rejectionReason?: string;
}

const INJECTION_PATTERNS = [
  /bỏ qua (các )?(hướng dẫn|quy tắc|lệnh|câu lệnh) (trước|trên)/i,
  /ignore (all )?(previous|above) (instructions|rules|prompts)/i,
  /quên (rằng )?bạn là (chatbot|gia sư) toán 8/i,
  /forget (that )?you are/i,
  /tiết lộ (system prompt|câu lệnh hệ thống|prompt nội bộ|api key|secret|token)/i,
  /reveal (system prompt|internal prompt|api key|secret)/i,
  /hãy đóng vai (hacker|toán 12|đại học|chuyên gia khác)/i,
  /hãy dùng kiến thức ngoài (sgk|sbt)/i,
  /you are now in developer mode/i,
  /jailbreak/i,
  /dan mode/i,
];

export function runInputGuard(question: string): InputGuardResult {
  if (!question || typeof question !== "string") {
    return {
      isSafe: false,
      sanitizedText: "",
      rejectionReason: "Câu hỏi trống hoặc không hợp lệ.",
    };
  }

  let sanitized = question
    .replace(/\0/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();

  if (sanitized.length > 2000) {
    sanitized = sanitized.slice(0, 2000);
  }

  if (sanitized.length === 0) {
    return {
      isSafe: false,
      sanitizedText: "",
      rejectionReason: "Vui lòng nhập nội dung câu hỏi Toán 8 của em.",
    };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      return {
        isSafe: false,
        sanitizedText: sanitized,
        rejectionReason:
          "Mình là Gia sư AI Toán 8 và chỉ hỗ trợ giải đáp các câu hỏi học tập thuộc chương trình Toán 8. Em hãy đặt câu hỏi liên quan đến bài học Toán 8 nhé!",
      };
    }
  }

  return {
    isSafe: true,
    sanitizedText: sanitized,
  };
}

export function sanitizeInput(question: string): { valid: boolean; reason?: string; sanitizedText?: string } {
  const res = runInputGuard(question);
  return {
    valid: res.isSafe,
    reason: res.rejectionReason,
    sanitizedText: res.sanitizedText,
  };
}
