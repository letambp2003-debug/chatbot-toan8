import { LearningMode, MessageSource } from "@/types/chat";
import { BookSet } from "@/types/knowledge";
import { sanitizeInput } from "@/lib/security/input_guard";
import { runScopeGuard } from "@/lib/scope/scope_guard";
import { routeQuery } from "@/lib/scope/router";
import { executeHybridRAG } from "@/lib/rag/retriever";
import { buildMathContext } from "@/lib/rag/context_builder";
import { generateMathSolution } from "@/lib/gemini/solver";
import { verifyMathAnswer, VerifierResult } from "@/lib/verifier/answer_verifier";
import { getGenAIClient } from "@/lib/gemini/client";
import { logger } from "@/lib/security/logger";

export interface PipelineExecutionOptions {
  question: string;
  mode: LearningMode;
  book_set: BookSet;
  chapter?: string;
  imageBase64?: string;
  imageMimeType?: string;
  apiKey: string;
}

export interface PipelineExecutionResult {
  answer: string;
  sources: MessageSource[];
  mode: LearningMode;
  verification: {
    passed: boolean;
    confidence: number;
    reason?: string;
    details?: VerifierResult;
  };
  success: boolean;
}

const MAX_REGENERATION_ATTEMPTS = 2;

export async function executeMathPipeline(
  options: PipelineExecutionOptions
): Promise<PipelineExecutionResult> {
  const { question, mode, book_set, chapter, imageBase64, imageMimeType, apiKey } = options;

  logger.info(`Bắt đầu thực thi 8-Stage Strict Pipeline cho câu hỏi [Mode: ${mode}]`);

  // STAGE 1: INPUT GUARD (Lọc rác và chống Prompt Injection)
  const inputCheck = sanitizeInput(question);
  if (!inputCheck.valid) {
    logger.warn(`Input Guard chặn câu hỏi: ${inputCheck.reason}`);
    return {
      answer: `⚠️ ${inputCheck.reason}`,
      sources: [{ source_type: "KT_MD", title: "Bộ quy tắc bảo mật hệ thống", snippet: "Quy tắc an toàn Toán 8" }],
      mode,
      verification: { passed: false, confidence: 1.0, reason: inputCheck.reason },
      success: false,
    };
  }

  // Khởi tạo GoogleGenAI client với API key của người dùng
  const aiClient = getGenAIClient(apiKey);

  // STAGE 2: SCOPE GUARD (Kiểm soát phạm vi Toán 8 & Structured JSON)
  const scopeResult = await runScopeGuard(question, aiClient);

  if (scopeResult.decision === "OUT_OF_SCOPE") {
    logger.info(`Scope Guard từ chối câu hỏi ngoài phạm vi: ${scopeResult.reason}`);
    return {
      answer: `Em thông cảm nhé! Thầy là Gia sư AI chuyên trách **môn Toán lớp 8** (theo chương trình SGK & SBT Kết nối tri thức, Chân trời sáng tạo, Cánh diều).\n\nCâu hỏi này nằm ngoài phạm vi hỗ trợ (${scopeResult.reason}). Em hãy gửi câu hỏi hoặc bài tập thuộc chương trình Toán 8 để thầy đồng hành cùng em nhé!`,
      sources: [{ source_type: "KT_MD", title: "Phạm vi chương trình Toán 8", snippet: scopeResult.reason }],
      mode,
      verification: { passed: true, confidence: scopeResult.confidence, reason: "Out of scope handled safely" },
      success: true,
    };
  }

  if (scopeResult.decision === "UNCERTAIN") {
    logger.info(`Scope Guard xác định câu hỏi chưa đủ ngữ cảnh: ${scopeResult.reason}`);
    return {
      answer: `Thầy chưa có đủ dữ kiện hoặc ngữ cảnh đề bài để giải đáp chính xác cho em (${scopeResult.reason}).\n\nEm vui lòng cung cấp thêm đề bài chi tiết, số trang/bài trong SGK/SBT hoặc chụp ảnh bài toán gửi cho thầy nhé!`,
      sources: [{ source_type: "KT_MD", title: "Yêu cầu bổ sung dữ kiện", snippet: "Thiếu ngữ cảnh đề bài" }],
      mode,
      verification: { passed: true, confidence: scopeResult.confidence, reason: "Insufficient context handled safely" },
      success: true,
    };
  }

  // STAGE 3: QUERY ROUTER
  const routerResult = routeQuery({
    question,
    mode,
    scopeResult,
  });

  // STAGE 4: HYBRID RAG RETRIEVER (Top 12 -> Rerank Best 4-6)
  const ragResult = await executeHybridRAG({
    question,
    bookSet: book_set,
    chapter,
    topicId: scopeResult.topic_id || undefined,
    routerResult,
    aiClient,
  });

  if (ragResult.insufficientContext && ragResult.chunks.length === 0) {
    logger.warn("RAG Retrieval confidence quá thấp, trả về INSUFFICIENT_CONTEXT");
    return {
      answer: `Thầy chưa tìm thấy đủ tài liệu chuẩn trong Sách giáo khoa và Sách bài tập Toán 8 để giải đáp câu hỏi này một cách chắc chắn.\n\nEm hãy kiểm tra lại đề bài, nêu rõ bài học hoặc gửi ảnh chụp bài tập để thầy hỗ trợ em tốt nhất nhé!`,
      sources: [{ source_type: "SGK", title: "Kho học liệu SGK & SBT Toán 8", snippet: "Không tìm thấy nội dung tương ứng" }],
      mode,
      verification: { passed: false, confidence: ragResult.bestScore, reason: "Insufficient RAG context" },
      success: true,
    };
  }

  // STAGE 5: CONTEXT BUILDER (Ghép nối kt.md, tc.md, student context, retrieved knowledge)
  const mathContext = buildMathContext({
    question,
    mode,
    bookSet: book_set,
    chapter,
    scopeResult,
    routerResult,
    chunks: ragResult.chunks,
    imageBase64,
    imageMimeType,
  });

  // STAGE 6 & 7: GEMINI SOLVER + VERIFIER VỚI SELF-CORRECTION LOOP (TỐI ĐA 2 LẦN REGENERATE)
  let finalAnswer = "";
  let latestVerification: any = null;
  let retryFeedback: string | undefined = undefined;

  for (let attempt = 0; attempt <= MAX_REGENERATION_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      logger.warn(`Kích hoạt Self-Correction Regeneration lần ${attempt}/${MAX_REGENERATION_ATTEMPTS} với feedback: ${retryFeedback}`);
    }

    const solverOutput = await generateMathSolution({
      prompt: mathContext.prompt,
      systemInstruction: mathContext.systemInstruction,
      imageBase64,
      imageMimeType,
      feedback: retryFeedback,
      aiClient,
      retrievedChunks: ragResult.chunks,
    });

    finalAnswer = solverOutput.text;

    // Chạy Answer Verifier
    latestVerification = await verifyMathAnswer({
      question,
      answer: finalAnswer,
      retrievedChunks: ragResult.chunks,
      aiClient,
    });

    if (latestVerification.passed) {
      logger.info(`Answer Verifier PASSED tại lần thử thứ ${attempt + 1}.`);
      break;
    } else {
      retryFeedback = latestVerification.reason || "Lời giải chưa đạt chuẩn phương pháp Toán 8 hoặc tính toán chưa chính xác.";
    }
  }

  // NẾU SAU 2 LẦN TÁI TẠO VẪN KHÔNG ĐẠT TIÊU CHUẨN -> SAFE FALLBACK
  if (latestVerification && !latestVerification.passed) {
    logger.error("Lời giải không vượt qua Verifier sau 2 lần regenerate. Sử dụng Safe Fallback an toàn.");
    finalAnswer = `Chào em! Để đảm bảo tính chính xác và phương pháp sư phạm chuẩn mực theo chương trình Toán 8, thầy khuyến khích em xem lại nội dung bài học liên quan trong SGK/SBT Toán 8 (${book_set}).\n\nEm hãy chia sẻ cụ thể bước em đang vướng mắc hoặc chụp ảnh bài giải của em để thầy cùng tháo gỡ từng bước nhé!`;
  }

  // STAGE 8: RESPONSE ASSEMBLY & CITATIONS
  const sources: MessageSource[] = ragResult.chunks.map((chunk) => {
    const volStr = chunk.volume ? ` Tập ${chunk.volume}` : "";
    const chapStr = chunk.chapter ? ` Chương ${chunk.chapter}` : "";
    const lessonStr = chunk.lesson ? ` Bài ${chunk.lesson}` : "";
    const exStr = chunk.exercise_id ? ` - Bài tập ${chunk.exercise_id}` : "";
    const pageStr = chunk.page ? ` (Trang ${chunk.page})` : "";

    return {
      id: chunk.id,
      source_type: chunk.source_type,
      book_set: chunk.book_set,
      volume: chunk.volume,
      chapter: chunk.chapter,
      lesson: chunk.lesson,
      exercise_id: chunk.exercise_id,
      page: chunk.page,
      topic_id: chunk.topic_id,
      title: `${chunk.source_type} Toán 8${volStr}${chapStr}${lessonStr}${exStr}${pageStr}`,
      snippet: chunk.content.slice(0, 160) + "...",
    };
  });

  if (sources.length === 0) {
    sources.push({
      source_type: "SGK",
      book_set,
      title: `SGK Toán 8 (${book_set})`,
      snippet: "Kiến thức chuẩn chương trình Toán lớp 8",
    });
  }

  logger.info("Hoàn tất 8-Stage Strict Pipeline thành công.");

  return {
    answer: finalAnswer,
    sources,
    mode,
    verification: {
      passed: latestVerification ? latestVerification.passed : true,
      confidence: latestVerification ? latestVerification.confidence : 0.95,
      reason: latestVerification ? latestVerification.reason : undefined,
      details: latestVerification ? latestVerification.result : undefined,
    },
    success: true,
  };
}
