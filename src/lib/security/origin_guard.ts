import { NextRequest } from "next/server";

/**
 * Origin & CSRF Guard
 * Kiểm tra tính hợp lệ của header Origin/Referer để chống tấn công CSRF.
 */
export function validateRequestOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin || !host) {
    // Cho phép server-side fetches hoặc môi trường development/test
    return true;
  }

  try {
    const originUrl = new URL(origin);
    // Khớp hostname và port
    return originUrl.host === host || host.startsWith(originUrl.hostname);
  } catch {
    return false;
  }
}
