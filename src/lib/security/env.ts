/**
 * Environment Variables Validation Module
 * Xác thực toàn bộ các biến môi trường khi ứng dụng khởi động.
 */

export interface AppEnv {
  KEY_ENCRYPTION_SECRET: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  GEMINI_ADMIN_API_KEY?: string;
  GEMINI_GENERATION_MODEL: string;
  GEMINI_EMBEDDING_MODEL: string;
  STRICT_TOAN8_MODE: boolean;
  NODE_ENV: "development" | "production" | "test";
}

export function validateEnv(): AppEnv {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("LỖI BẢO MẬT: KEY_ENCRYPTION_SECRET bắt buộc phải được cấu hình trong môi trường Production!");
    } else {
      console.warn("CẢNH BÁO: KEY_ENCRYPTION_SECRET chưa được đặt, đang dùng fallback cho development.");
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key";

  return {
    KEY_ENCRYPTION_SECRET: secret || "default-dev-secret-replace-in-production-32-chars-long",
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_ADMIN_API_KEY: process.env.GEMINI_ADMIN_API_KEY,
    GEMINI_GENERATION_MODEL: process.env.GEMINI_GENERATION_MODEL || "gemini-3.7-flash",
    GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    STRICT_TOAN8_MODE: process.env.STRICT_TOAN8_MODE !== "false",
    NODE_ENV: (process.env.NODE_ENV as any) || "development",
  };
}

export const env = validateEnv();
