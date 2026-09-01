import { NextRequest, NextResponse } from "next/server";
import { decryptApiKey, COOKIE_NAME } from "@/lib/security/encryption";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { getSystemKeyPoolSummary } from "@/lib/gemini/key_pool";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    const poolSummary = getSystemKeyPoolSummary();

    if (cookie?.value) {
      const decrypted = decryptApiKey(cookie.value);
      if (decrypted) {
        return NextResponse.json({
          connected: true,
          isCustomKey: true,
          usingSystemDefault: false,
          expiresAt: decrypted.exp,
          model: GEMINI_CONFIG.generationModel,
          strictMode: GEMINI_CONFIG.strictToan8Mode,
          systemKeyCount: poolSummary.activeCount,
          label: "Đã kết nối AI Key cá nhân",
        });
      }
    }

    // Nếu học sinh chưa nhập key riêng, hệ thống tự động cung cấp Default System Key Pool
    return NextResponse.json({
      connected: poolSummary.activeCount > 0,
      isCustomKey: false,
      usingSystemDefault: true,
      model: GEMINI_CONFIG.generationModel,
      strictMode: GEMINI_CONFIG.strictToan8Mode,
      systemKeyCount: poolSummary.activeCount,
      label: "Đang dùng AI Key hệ thống (Mặc định cho học sinh)",
    });
  } catch (error) {
    return NextResponse.json({
      connected: true,
      isCustomKey: false,
      usingSystemDefault: true,
      label: "Đang dùng AI Key hệ thống",
    });
  }
}
