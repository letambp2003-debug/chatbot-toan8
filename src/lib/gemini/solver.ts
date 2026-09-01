import { GoogleGenAI } from "@google/genai";
import { GEMINI_CONFIG } from "./config";
import { logger } from "../security/logger";

export interface GeminiSolverOptions {
  aiClient: GoogleGenAI;
  systemInstruction: string;
  userPrompt: string;
  imageBase64?: string;
  imageMimeType?: string;
  feedback?: string;
}

export async function runGeminiSolver(options: GeminiSolverOptions): Promise<string> {
  const { aiClient, systemInstruction, userPrompt, imageBase64, imageMimeType, feedback } = options;

  let contents: any[] = [];

  if (imageBase64 && imageMimeType) {
    contents.push({
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType,
      },
    });
  }

  let promptText = userPrompt;
  if (feedback) {
    promptText += `\n\n[LƯU Ý HIỆU CHỈNH TỪ BỘ KIỂM TRA LỜI GIẢI (VERIFIER)]:
Lần giải trước chưa đạt yêu cầu do: ${feedback}.
Yêu cầu: Hãy sửa lại lời giải thật chặt chẽ, tính toán chuẩn xác từng bước, đúng phương pháp Toán 8 và không dùng kiến thức vượt cấp.`;
  }

  contents.push({
    text: promptText,
  });

  // Danh sách model ưu tiên từ cao xuống thấp để tự động fallback nếu model hiện tại không khả dụng
  const candidateModels = [
    GEMINI_CONFIG.generationModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
  ];

  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: GEMINI_CONFIG.temperature,
          topP: GEMINI_CONFIG.topP,
          maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
        },
      });

      const answerText = response.text || "";
      if (answerText.trim()) {
        return answerText;
      }
    } catch (error: any) {
      lastError = error;
      const errStr = (error?.message || error?.toString() || "").toLowerCase();

      // Nếu lỗi là 404 (model not found) -> thử model kế tiếp
      if (errStr.includes("not found") || errStr.includes("404") || errStr.includes("not supported")) {
        logger.warn(`Model ${modelName} không khả dụng cho key này, đang chuyển sang model tiếp theo trong danh sách.`);
        continue;
      }

      // Nếu lỗi là 401 hoặc 429 hoặc lỗi khác -> throw luôn
      throw error;
    }
  }

  throw lastError || new Error("Không thể nhận phản hồi từ bất kỳ mô hình Gemini nào.");
}

export async function generateMathSolution(options: {
  prompt: string;
  systemInstruction: string;
  imageBase64?: string;
  imageMimeType?: string;
  feedback?: string;
  aiClient: GoogleGenAI;
}): Promise<{ text: string }> {
  const text = await runGeminiSolver({
    aiClient: options.aiClient,
    systemInstruction: options.systemInstruction,
    userPrompt: options.prompt,
    imageBase64: options.imageBase64,
    imageMimeType: options.imageMimeType,
    feedback: options.feedback,
  });
  return { text };
}
