import { NextRequest, NextResponse } from "next/server";
import { validateGoogleApiKey } from "@/lib/gemini/client";
import { encryptApiKey, COOKIE_NAME, DEFAULT_TTL_SECONDS } from "@/lib/security/encryption";
import { checkRateLimit } from "@/lib/security/rate_limiter";
import { validateRequestOrigin } from "@/lib/security/origin_guard";
import { logger } from "@/lib/security/logger";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    // 1. Kiểm tra Origin & CSRF Guard
    if (!validateRequestOrigin(req)) {
      return NextResponse.json(
        { valid: false, message: "Yêu cầu bị từ chối do không hợp lệ về Origin." },
        { status: 403 }
      );
    }

    // 2. Kiểm tra Request Size Limit (tối đa 4KB cho payload validate key)
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 4 * 1024) {
      return NextResponse.json(
        { valid: false, message: "Kích thước yêu cầu vượt quá giới hạn cho phép." },
        { status: 413 }
      );
    }

    // 3. Rate Limiting theo Client IP (Tối đa 10 lần/phút)
    const ip = req.headers.get("x-forwarded-for") || "local_client";
    const rateLimit = checkRateLimit(`val_key_${ip}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          valid: false,
          reason: "rate_limited",
          message: `Bạn đã thử quá nhiều lần. Vui lòng chờ ${rateLimit.resetInSec} giây trước khi thử lại.`,
        },
        { status: 429 }
      );
    }

    // 4. Nhận API Key (TUYỆT ĐỐI KHÔNG LOG NỘI DUNG KEY)
    const body = await req.json();
    const apiKey = body?.apiKey?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, reason: "invalid_key", message: "Vui lòng nhập Google AI API key." },
        { status: 400 }
      );
    }

    // 5. Thực hiện lightweight validation qua Google GenAI SDK
    const validationResult = await validateGoogleApiKey(apiKey);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          valid: false,
          reason: validationResult.reason,
          message: validationResult.message,
        },
        { status: validationResult.status }
      );
    }

    // 6. Mã hóa bằng AES-256-GCM với TTL 8 giờ
    const encryptedCookieValue = encryptApiKey(apiKey, DEFAULT_TTL_SECONDS);

    const response = NextResponse.json({
      valid: true,
      message: "Kết nối Google AI thành công.",
      expiresIn: DEFAULT_TTL_SECONDS,
    });

    // 7. Tạo HttpOnly, Secure, SameSite=Strict cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: encryptedCookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: DEFAULT_TTL_SECONDS,
    });

    logger.info("Session Google AI của người dùng đã được kích hoạt (AES-256-GCM encrypted cookie set, TTL: 8h).");
    return response;
  } catch (error: any) {
    logger.error("Lỗi khi xử lý POST /api/key/validate:", error?.message);
    return NextResponse.json(
      { valid: false, reason: "network_error", message: "Đã xảy ra lỗi khi kiểm tra kết nối." },
      { status: 500 }
    );
  }
}
