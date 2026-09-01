import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "@/lib/ai/config";
import { BuiltContext } from "./5_context_builder";

export interface SolverOptions {
  aiClient: GoogleGenAI;
  context: BuiltContext;
  imageBase64?: string;
  imageMimeType?: string;
  feedback?: string; // Feedback từ Answer Verifier nếu cần sinh lại
}

export async function runGeminiSolver(options: SolverOptions): Promise<string> {
  const { aiClient, context, imageBase64, imageMimeType, feedback } = options;

  let contents: any[] = [];

  // Nếu có ảnh bài toán đính kèm
  if (imageBase64 && imageMimeType) {
    contents.push({
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType,
      },
    });
  }

  // Nội dung câu hỏi và phản hồi hiệu chỉnh nếu có
  let promptText = context.userPrompt;
  if (feedback) {
    promptText += `\n\n[LƯU Ý HIỆU CHỈNH TỪ BỘ KIỂM TRA LỜI GIẢI]: ${feedback}. Hãy sửa lại lời giải cho thật chuẩn xác và đúng phương pháp Toán 8.`;
  }

  contents.push({
    text: promptText,
  });

  const response = await aiClient.models.generateContent({
    model: AI_CONFIG.generationModel,
    contents: contents,
    config: {
      systemInstruction: context.systemInstruction,
      temperature: AI_CONFIG.temperature,
      topP: AI_CONFIG.topP,
      maxOutputTokens: AI_CONFIG.maxOutputTokens,
    },
  });

  const answerText = response.text || "";
  if (!answerText.trim()) {
    throw new Error("Không nhận được câu trả lời từ mô hình AI.");
  }

  return answerText;
}
