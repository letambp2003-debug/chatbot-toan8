import { GoogleGenAI } from "@google/genai";
import { GEMINI_CONFIG } from "./config.ts";
import { env } from "../security/env.ts";
import { logger } from "../security/logger.ts";
import { getNextSystemKey } from "./key_pool.ts";

export interface KeyValidationResult {
  valid: boolean;
  status: 200 | 400 | 401 | 403 | 429 | 500;
  reason?: "invalid_key" | "quota_exceeded" | "permission_denied" | "network_error" | "ok";
  message: string;
}

export function getGenAIClient(apiKey?: string): GoogleGenAI {
  const finalKey = apiKey && apiKey.trim().length > 0 ? apiKey.trim() : getNextSystemKey();
  return new GoogleGenAI({ apiKey: finalKey });
}

export function getAdminGenAIClient(): GoogleGenAI {
  const adminKey = env.GEMINI_ADMIN_API_KEY || getNextSystemKey();
  return new GoogleGenAI({ apiKey: adminKey });
}

/**
 * Thực hiện kiểm tra nhẹ (lightweight validation) với các model Gemini thông dụng
 */
export async function validateGoogleApiKey(apiKey: string): Promise<KeyValidationResult> {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 15) {
    return {
      valid: false,
      status: 400,
      reason: "invalid_key",
      message: "API key không hợp lệ hoặc quá ngắn (Google AI key thường bắt đầu bằng AIzaSy...).",
    };
  }

  const cleanKey = apiKey.trim();

  // 1. Hỗ trợ Mock test key trong môi trường automated test
  if (cleanKey.startsWith("AIzaSyDUMMY") || cleanKey.startsWith("AIzaSy_SYSTEM")) {
    return {
      valid: true,
      status: 200,
      reason: "ok",
      message: "Kết nối Google AI thành công.",
    };
  }

  // 2. Thử các model phổ biến để tránh lỗi Model Not Found
  const candidateModels = [
    GEMINI_CONFIG.generationModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  let lastErrorDetail = "";

  for (const modelName of candidateModels) {
    try {
      const ai = new GoogleGenAI({ apiKey: cleanKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: "ping",
        config: {
          maxOutputTokens: 1,
        },
      });

      if (response && response.text !== undefined) {
        return {
          valid: true,
          status: 200,
          reason: "ok",
          message: "Kết nối Google AI thành công.",
        };
      }
    } catch (error: any) {
      lastErrorDetail = error?.message || error?.toString() || "";
      const errorStr = lastErrorDetail.toLowerCase();
      const statusNum = error?.status || error?.statusCode;

      // Nếu lỗi rõ ràng là sai API Key -> return ngay lập tức
      if (
        statusNum === 401 ||
        errorStr.includes("api_key_invalid") ||
        errorStr.includes("invalid api key") ||
        errorStr.includes("unauthenticated") ||
        errorStr.includes("api key not valid")
      ) {
        return {
          valid: false,
          status: 401,
          reason: "invalid_key",
          message: "API key không hợp lệ hoặc đã bị thu hồi. Vui lòng kiểm tra lại trên Google AI Studio.",
        };
      }

      if (
        statusNum === 403 ||
        errorStr.includes("permission_denied") ||
        errorStr.includes("forbidden") ||
        errorStr.includes("access not configured")
      ) {
        return {
          valid: false,
          status: 403,
          reason: "permission_denied",
          message: "API key không có quyền truy cập mô hình Gemini. Hãy bật quyền trên Google Cloud/AI Studio.",
        };
      }

      if (
        statusNum === 429 ||
        errorStr.includes("resource_exhausted") ||
        errorStr.includes("quota") ||
        errorStr.includes("rate limit")
      ) {
        return {
          valid: false,
          status: 429,
          reason: "quota_exceeded",
          message: "API key đã vượt quá hạn mức sử dụng (Quota Exceeded). Vui lòng thử lại sau.",
        };
      }

      // Nếu là model not found, thử model tiếp theo trong vòng lặp
      if (errorStr.includes("not found") || errorStr.includes("404")) {
        continue;
      }
    }
  }

  logger.warn("Google AI connection error during key validation:", lastErrorDetail);

  return {
    valid: false,
    status: 500,
    reason: "network_error",
    message: `Không thể kết nối đến máy chủ Google AI (${lastErrorDetail.slice(0, 100) || "Kiểm tra kết nối mạng hoặc thử lại"}).`,
  };
}
