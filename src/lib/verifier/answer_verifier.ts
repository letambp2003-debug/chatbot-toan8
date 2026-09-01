import { GoogleGenAI } from "@google/genai";
import { GEMINI_CONFIG } from "../gemini/config.ts";
import type { KnowledgeChunk } from "../../types/knowledge.ts";
import { logger } from "../security/logger.ts";

export interface VerifierResult {
  scope_ok: boolean;
  source_supported: boolean;
  calculation_ok: boolean;
  formula_ok: boolean;
  logic_ok: boolean;
  grade8_method: boolean;
  citation_ok: boolean;
  needs_regeneration: boolean;
  issues: string[];
}

const FORBIDDEN_KEYWORDS = [
  "system prompt",
  "bạn là một ai",
  "đạo hàm",
  "tích phân",
  "nguyên hàm",
  "giới hạn lim",
  "ma trận",
  "định thức det",
  "vector oxyz",
  "mặt phẳng (p)",
  "số phức",
  "biệt thức delta",
  "hệ thức vi-ét",
  "giải tích",
];

export function verifyAlgebraicCalculation(question: string, answer: string): { ok: boolean; issue?: string } {
  const eqMatch = question.match(/(?:^|\s)([+-]?\s*\d+)?\s*x\s*([+-]\s*\d+)?\s*=\s*([+-]?\s*\d+)/i);
  if (eqMatch) {
    let aStr = (eqMatch[1] || "").replace(/\s+/g, "");
    let a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
    let b = eqMatch[2] ? parseFloat(eqMatch[2].replace(/\s+/g, "")) : 0;
    let c = parseFloat(eqMatch[3].replace(/\s+/g, ""));

    if (a !== 0 && !isNaN(a) && !isNaN(b) && !isNaN(c)) {
      const correctX = (c - b) / a;
      const rootMatches = Array.from(answer.matchAll(/(?:^|[^\w])x\s*=\s*([+-]?\s*\d+(?:\.\d+)?)/gi));
      if (rootMatches.length > 0) {
        const lastRoot = rootMatches[rootMatches.length - 1];
        const extractedRoot = parseFloat(lastRoot[1].replace(/\s+/g, ""));
        if (!isNaN(extractedRoot) && Math.abs(extractedRoot - correctX) > 0.001) {
          return {
            ok: false,
            issue: `Nghiệm phương trình ${question} tính sai: Giá trị đúng là x = ${correctX}, nhưng lời giải ghi x = ${extractedRoot}.`,
          };
        }
      }
    }
  }

  if (/hiệu hai bình phương/i.test(question) || /a\^2\s*-\s*b\^2/i.test(question)) {
    if (answer.includes("A^2 - B^2") && answer.includes("A^2 + 2AB + B^2")) {
      return {
        ok: false,
        issue: "Nhầm lẫn công thức hiệu hai bình phương với bình phương của một tổng.",
      };
    }
  }

  return { ok: true };
}

export function runDeterministicVerifier(
  answer: string,
  question: string,
  retrievedChunks: KnowledgeChunk[] = []
): VerifierResult {
  const lowerAnswer = answer.toLowerCase();
  const lowerQuestion = question.toLowerCase();
  const issues: string[] = [];

  let scope_ok = true;
  let source_supported = true;
  let calculation_ok = true;
  let formula_ok = true;
  let logic_ok = true;
  let grade8_method = true;
  let citation_ok = true;
  let needs_regeneration = false;

  for (const kw of FORBIDDEN_KEYWORDS) {
    if (lowerAnswer.includes(kw)) {
      scope_ok = false;
      grade8_method = false;
      needs_regeneration = true;
      issues.push(`Phát hiện nội dung vượt cấp hoặc từ khóa không thuộc Toán 8: "${kw}".`);
    }
  }

  const calcCheck = verifyAlgebraicCalculation(question, answer);
  if (!calcCheck.ok) {
    calculation_ok = false;
    needs_regeneration = true;
    if (calcCheck.issue) issues.push(calcCheck.issue);
  }

  const hasMathExpression = /[xya-z]\^2|[a-z]\s*[\+\-\*\/]\s*[a-z]|\\frac/i.test(answer);
  const hasLatexDelimiters = answer.includes("\\(") || answer.includes("\\[") || answer.includes("$");

  if (hasMathExpression && !hasLatexDelimiters && answer.length > 50) {
    formula_ok = false;
    issues.push("Các công thức toán học cần được bọc trong định dạng LaTeX \\( ... \\) hoặc \\[ ... \\].");
  }

  if (lowerQuestion.includes("chứng minh") || lowerQuestion.includes("tứ giác") || lowerQuestion.includes("tam giác")) {
    const hasReasoning =
      /vì|do|theo định lý|theo tính chất|ta có|đồng dạng|song song/i.test(lowerAnswer);
    if (!hasReasoning && answer.length > 80) {
      logic_ok = false;
      needs_regeneration = true;
      issues.push("Lời giải hình học cần nêu rõ lý do và căn cứ định lý/tính chất cho từng kết luận.");
    }
  }

  if (answer.trim().length < 30) {
    logic_ok = false;
    needs_regeneration = true;
    issues.push("Lời giải quá ngắn, chưa đủ các bước hướng dẫn sư phạm.");
  }

  return {
    scope_ok,
    source_supported,
    calculation_ok,
    formula_ok,
    logic_ok,
    grade8_method,
    citation_ok,
    needs_regeneration: needs_regeneration || !scope_ok || !calculation_ok || !grade8_method,
    issues,
  };
}

export async function verifyMathAnswer(options: {
  question: string;
  answer: string;
  retrievedChunks?: KnowledgeChunk[];
  aiClient?: GoogleGenAI;
}): Promise<{ passed: boolean; confidence: number; result: VerifierResult; reason?: string }> {
  const { question, answer, retrievedChunks = [], aiClient } = options;

  const detResult = runDeterministicVerifier(answer, question, retrievedChunks);

  if (detResult.needs_regeneration) {
    return {
      passed: false,
      confidence: 0.35,
      result: detResult,
      reason: detResult.issues.join("; "),
    };
  }

  if (!aiClient) {
    return {
      passed: true,
      confidence: 0.95,
      result: detResult,
      reason: "Đã vượt qua toàn bộ các bài kiểm tra toán học tất định.",
    };
  }

  try {
    const verifierPrompt = `Bạn là Verifier chuyên trách kiểm định lời giải Toán 8.
Nhiệm vụ: Kiểm tra lời giải xem có chuẩn phương pháp Toán 8, tính toán đúng và không vượt cấp hay không.

Câu hỏi của học sinh: "${question}"
Bản nháp lời giải:
"""
${answer}
"""

Hãy trả về DUY NHẤT một JSON hợp lệ:
{
  "scope_ok": boolean,
  "source_supported": boolean,
  "calculation_ok": boolean,
  "formula_ok": boolean,
  "logic_ok": boolean,
  "grade8_method": boolean,
  "citation_ok": boolean,
  "needs_regeneration": boolean,
  "issues": ["mô tả lỗi nếu có"]
}`;

    const response = await aiClient.models.generateContent({
      model: GEMINI_CONFIG.generationModel,
      contents: verifierPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (text) {
      const parsed: VerifierResult = JSON.parse(text);
      const passed =
        !parsed.needs_regeneration &&
        parsed.scope_ok &&
        parsed.calculation_ok &&
        parsed.grade8_method &&
        parsed.logic_ok;

      return {
        passed,
        confidence: passed ? 0.98 : 0.4,
        result: parsed,
        reason: parsed.issues && parsed.issues.length > 0 ? parsed.issues.join("; ") : undefined,
      };
    }
  } catch (error: any) {
    logger.warn("Gemini Verifier JSON parse error, using deterministic result:", error?.message);
  }

  return {
    passed: !detResult.needs_regeneration,
    confidence: 0.95,
    result: detResult,
    reason: detResult.issues.length > 0 ? detResult.issues.join("; ") : undefined,
  };
}
