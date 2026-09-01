import { NextRequest, NextResponse } from "next/server";
import { runFullKnowledgeIngestion } from "@/lib/ingestion/pipeline";
import { logger } from "@/lib/security/logger";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    logger.info("Admin kích hoạt chạy Ingestion toàn bộ tài liệu SGK/SBT/Rules...");
    const result = await runFullKnowledgeIngestion();

    return NextResponse.json({
      success: true,
      durationMs: result.durationMs,
      totalDocuments: result.documents.length,
      totalChunks: result.chunks.length,
      coverage: result.coverage,
    });
  } catch (error: any) {
    logger.error("Lỗi Ingestion API:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Đã xảy ra lỗi trong quá trình Ingestion" },
      { status: 500 }
    );
  }
}
