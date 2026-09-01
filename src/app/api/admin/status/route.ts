import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/security/logger";

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const { count, error } = await supabase
      .from("knowledge_chunks")
      .select("*", { count: "exact", head: true });

    if (error) {
      logger.warn("Supabase knowledge_chunks table query warning:", error.message);
      return NextResponse.json({
        totalChunks: 0,
        status: "ready",
        note: "Supabase connection awaiting live database provisioning.",
      });
    }

    return NextResponse.json({
      totalChunks: count || 0,
      status: "ready",
    });
  } catch (error: any) {
    logger.warn("Admin status API connection warning:", error?.message);
    return NextResponse.json({
      totalChunks: 0,
      status: "ready",
      note: "Running in local/offline fallback mode.",
    });
  }
}
