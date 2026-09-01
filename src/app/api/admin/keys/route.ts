import { NextRequest, NextResponse } from "next/server";
import { getSystemKeyPoolSummary, addSystemKeyToPool, removeSystemKeyFromPool } from "@/lib/gemini/key_pool";
import { validateGoogleApiKey } from "@/lib/gemini/client";
import { logger } from "@/lib/security/logger";

export async function GET(req: NextRequest) {
  try {
    const summary = getSystemKeyPoolSummary();
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Lỗi lấy danh sách keys" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body?.apiKey?.trim();
    const label = body?.label?.trim();

    if (!apiKey) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập API key" }, { status: 400 });
    }

    // Kiểm tra tính hợp lệ của key trước khi thêm vào pool
    const validation = await validateGoogleApiKey(apiKey);
    if (!validation.valid && !apiKey.startsWith("AIzaSy")) {
      return NextResponse.json(
        { success: false, message: `Key không hợp lệ: ${validation.message}` },
        { status: 400 }
      );
    }

    const added = addSystemKeyToPool(apiKey, label);
    if (added) {
      logger.info(`Admin đã thêm API key vào pool cho học sinh.`);
      return NextResponse.json({
        success: true,
        message: "Đã thêm API key vào Pool mặc định cho học sinh thành công.",
        summary: getSystemKeyPoolSummary(),
      });
    }

    return NextResponse.json({ success: false, message: "Không thể thêm API key" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const keyId = body?.keyId;

    if (!keyId) {
      return NextResponse.json({ success: false, message: "Thiếu ID key cần xóa" }, { status: 400 });
    }

    const removed = removeSystemKeyFromPool(keyId);
    if (removed) {
      return NextResponse.json({
        success: true,
        message: "Đã xóa API key khỏi pool hệ thống.",
        summary: getSystemKeyPoolSummary(),
      });
    }

    return NextResponse.json({ success: false, message: "Key không tồn tại" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || "Lỗi máy chủ" }, { status: 500 });
  }
}
