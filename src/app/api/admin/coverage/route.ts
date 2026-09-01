import { NextRequest, NextResponse } from "next/server";
import { runFullKnowledgeIngestion } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";

let cachedCoverage: any = null;

export async function GET(req: NextRequest) {
  try {
    if (!cachedCoverage) {
      const result = await runFullKnowledgeIngestion();
      cachedCoverage = result.coverage;
    }

    return NextResponse.json(cachedCoverage);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Lỗi khi tạo báo cáo coverage" },
      { status: 500 }
    );
  }
}
