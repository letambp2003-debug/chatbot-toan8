import { NextRequest, NextResponse } from "next/server";
import { decryptApiKey, COOKIE_NAME } from "@/lib/security/encryption";
import { GEMINI_CONFIG } from "@/lib/gemini/config";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie?.value) {
      return NextResponse.json({ connected: false });
    }

    const decrypted = decryptApiKey(cookie.value);
    if (!decrypted) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      expiresAt: decrypted.exp,
      model: GEMINI_CONFIG.generationModel,
      strictMode: GEMINI_CONFIG.strictToan8Mode,
    });
  } catch (error) {
    return NextResponse.json({ connected: false });
  }
}
