import { NextRequest, NextResponse } from "next/server";
import { decryptApiKey, COOKIE_NAME } from "@/lib/security/encryption";
import { executeMathPipeline } from "@/lib/pipeline";
import { LearningMode } from "@/types/chat";
import { BookSet } from "@/lib/knowledge/types";
import { validateRequestOrigin } from "@/lib/security/origin_guard";
import { logger } from "@/lib/security/logger";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // 1. Kiểm tra Origin & CSRF Guard
    if (!validateRequestOrigin(req)) {
      return NextResponse.json(
        { error: "Yêu cầu bị từ chối do không hợp lệ về Origin." },
        { status: 403 }
      );
    }

    // 2. Kiểm tra Request Size Limit (Tối đa 10MB cho câu hỏi + ảnh)
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Kích thước tệp gửi lên vượt quá giới hạn 10MB." },
        { status: 413 }
      );
    }

    // 3. Kiểm tra và giải mã User API Key từ HttpOnly Cookie (TTL 8h)
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie?.value) {
      return NextResponse.json(
        { error: "Phiên Google AI chưa được kết nối hoặc đã hết hạn (TTL 8h). Em hãy kết nối lại API key nhé." },
        { status: 401 }
      );
    }

    const decrypted = decryptApiKey(cookie.value);
    if (!decrypted || !decrypted.key) {
      return NextResponse.json(
        { error: "Phiên làm việc không hợp lệ hoặc đã hết hạn. Vui lòng kết nối lại Google AI API key." },
        { status: 401 }
      );
    }

    // 4. Đọc dữ liệu câu hỏi từ client
    const formData = await req.formData();
    const question = (formData.get("question") as string)?.trim() || "";
    const mode = ((formData.get("mode") as string) || "EXPLAIN") as LearningMode;
    const book_set = ((formData.get("book_set") as string) || "KNTT") as BookSet;
    const chapter = (formData.get("chapter") as string) || "";
    const imageFile = formData.get("image") as File | null;

    if (!question && !imageFile) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung câu hỏi hoặc gửi ảnh bài toán." },
        { status: 400 }
      );
    }

    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      imageBase64 = Buffer.from(bytes).toString("base64");
      imageMimeType = imageFile.type;
    }

    logger.info(`Đang xử lý câu hỏi Toán 8 [${mode}] - Bộ sách: ${book_set}`);

    // 5. Thực thi 8-Stage Strict Pipeline
    const pipelineOutput = await executeMathPipeline({
      question,
      mode,
      book_set,
      chapter,
      imageBase64,
      imageMimeType,
      apiKey: decrypted.key,
    });

    return NextResponse.json({
      answer: pipelineOutput.answer,
      sources: pipelineOutput.sources,
      mode: pipelineOutput.mode,
      verification: pipelineOutput.verification,
      success: pipelineOutput.success,
    });
  } catch (error: any) {
    logger.error("Chat API pipeline error:", error?.message);
    return NextResponse.json(
      { error: "Đã xảy ra sự cố trong quá trình xử lý câu hỏi. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
