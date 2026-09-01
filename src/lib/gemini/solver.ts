import { GoogleGenAI } from "@google/genai";
import { GEMINI_CONFIG } from "./config";

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

  const response = await aiClient.models.generateContent({
    model: GEMINI_CONFIG.generationModel,
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      temperature: GEMINI_CONFIG.temperature,
      topP: GEMINI_CONFIG.topP,
      maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
    },
  });

  const answerText = response.text || "";
  if (!answerText.trim()) {
    throw new Error("Không nhận được câu trả lời từ mô hình AI.");
  }

  return answerText;
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
