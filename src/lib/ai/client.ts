import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "./config";

/**
 * Tạo instance GoogleGenAI client với API key được cung cấp.
 * @param apiKey User API key (đã giải mã) hoặc Admin API key
 */
export function getGenAIClient(apiKey: string): GoogleGenAI {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("Google GenAI API key is required");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Lấy Admin GenAI client (dùng server-side cho Ingestion/Indexing)
 */
export function getAdminGenAIClient(): GoogleGenAI {
  const adminKey = process.env.GEMINI_ADMIN_API_KEY;
  if (!adminKey) {
    throw new Error("GEMINI_ADMIN_API_KEY is not configured on server");
  }
  return new GoogleGenAI({ apiKey: adminKey });
}

/**
 * Kiểm tra tính hợp lệ của API key bằng cách gọi thử generateText với prompt tối thiểu
 */
export async function validateGoogleApiKey(apiKey: string): Promise<boolean> {
  try {
    const ai = getGenAIClient(apiKey);
    // Gọi model với prompt siêu ngắn để xác thực key và quota
    const response = await ai.models.generateContent({
      model: AI_CONFIG.generationModel,
      contents: "ping",
      config: {
        maxOutputTokens: 2,
      },
    });
    return Boolean(response && response.text !== undefined);
  } catch (error: any) {
    console.error("API Key Validation error:", error?.message || "Unknown error");
    return false;
  }
}
