import crypto from "crypto";
import { EncryptedKeyPayload } from "@/types/session";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recommended for GCM
const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export const COOKIE_NAME = "toan8_ai_session";

/**
 * Lấy encryption key 32-byte từ biến môi trường.
 * Nếu chuỗi chưa đúng 32 bytes, băm SHA-256 để luôn đảm bảo 256-bit key an toàn.
 */
function getMasterKey(): Buffer {
  const rawSecret = process.env.KEY_ENCRYPTION_SECRET || "default-dev-secret-replace-in-production-32-chars-long";
  return crypto.createHash("sha256").update(rawSecret).digest();
}

/**
 * Mã hóa API key bằng AES-256-GCM với IV và Auth Tag.
 * @param apiKey Google AI API key của người dùng
 * @param ttlSeconds Thời gian sống của key (mặc định 24h)
 * @returns Chuỗi JSON stringify mã hóa Base64 an toàn cho cookie
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
 * Giải mã chuỗi cookie trả về Google AI API key nguyên bản.
 * Xác thực Auth Tag và TTL.
 */
export function decryptApiKey(encryptedCookieValue: string): string | null {
  if (!encryptedCookieValue) {
    return null;
  }

  try {
    const rawJson = Buffer.from(encryptedCookieValue, "base64url").toString("utf8");
    const payload: EncryptedKeyPayload = JSON.parse(rawJson);

    if (!payload.k || !payload.iv || !payload.tag || !payload.exp) {
      return null;
    }

    // Kiểm tra hết hạn TTL
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

    return decrypted;
  } catch (error) {
    // Không bao giờ throw lỗi làm lộ thông tin cấu trúc mã hóa
    return null;
  }
}
