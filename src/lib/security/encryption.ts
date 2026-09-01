import crypto from "crypto";
import type { EncryptedKeyPayload } from "../../types/session.ts";
import { env } from "./env.ts";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recommended for GCM
export const DEFAULT_TTL_SECONDS = 8 * 60 * 60; // 8 hours as requested in Phase 2

export const COOKIE_NAME = "toan8_ai_session";

function getMasterKey(): Buffer {
  return crypto.createHash("sha256").update(env.KEY_ENCRYPTION_SECRET).digest();
}

/**
 * Mã hóa API key bằng AES-256-GCM với IV và Auth Tag.
 * @param apiKey Google AI API key của người dùng
 * @param ttlSeconds Thời gian sống của key (mặc định 8h)
 * @returns Chuỗi base64url an toàn cho cookie
 */
export function encryptApiKey(apiKey: string, ttlSeconds: number = DEFAULT_TTL_SECONDS): string {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("Invalid API key provided for encryption");
  }

  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(apiKey, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  const payload: EncryptedKeyPayload = {
    k: encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    exp: Date.now() + ttlSeconds * 1000,
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/**
 * Giải mã cookie trả về Google AI API key nguyên bản và thời hạn exp.
 * Xác thực Auth Tag và TTL 8 giờ.
 */
export function decryptApiKey(encryptedCookieValue: string): { key: string; exp: number } | null {
  if (!encryptedCookieValue) {
    return null;
  }

  try {
    const rawJson = Buffer.from(encryptedCookieValue, "base64url").toString("utf8");
    const payload: EncryptedKeyPayload = JSON.parse(rawJson);

    if (!payload.k || !payload.iv || !payload.tag || !payload.exp) {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null;
    }

    const key = getMasterKey();
    const iv = Buffer.from(payload.iv, "hex");
    const tag = Buffer.from(payload.tag, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(payload.k, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return { key: decrypted, exp: payload.exp };
  } catch (error) {
    return null;
  }
}

export function validateApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") return false;
  const trimmed = apiKey.trim();
  return trimmed.startsWith("AIzaSy") && trimmed.length >= 35;
}

export function safeRedact(text: string): string {
  if (!text) return "";
  return text.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, "[REDACTED_AIZA_KEY]");
}
