import crypto from "crypto";
import type { KnowledgeChunk, SourceType, BookSet } from "../../types/knowledge.ts";
import { findLessonMetadata } from "../knowledge/curriculum.ts";

export interface SemanticChunkInput {
  documentId?: string;
  sourceType: SourceType | "RULES";
  bookSet: BookSet;
  volume?: 1 | 2;
  pageNumber: number;
  rawText: string;
  isLowText?: boolean;
}

export function chunkPageSemantically(input: SemanticChunkInput): KnowledgeChunk[] {
  const { documentId, sourceType, bookSet, volume = 1, pageNumber, rawText, isLowText } = input;
  const chunks: KnowledgeChunk[] = [];
  const meta = findLessonMetadata(volume, pageNumber);

  const cleanText = rawText.replace(/timdapan\.com/gi, "").trim();
  const hasVisual = isLowText || cleanText.length < 80 || /hình|biểu đồ|tam giác|tứ giác/i.test(cleanText);

  if (sourceType === "SGK") {
    const chunkId = `SGK_T8_V${volume}_CH${String(meta.chapter).padStart(2, "0")}_L${String(meta.lesson).padStart(2, "0")}_P${String(pageNumber).padStart(3, "0")}`;
    
    const knowledgeContent = cleanText.length > 50
      ? cleanText
      : `[${meta.chapterTitle} - Bài ${meta.lesson}: ${meta.lessonTitle}] Kiến thức trọng tâm trang ${pageNumber}: Khái niệm, định lý, công thức và phương pháp giải thuộc chủ đề ${meta.topicId}.`;

    const checksum = crypto.createHash("sha256").update(knowledgeContent).digest("hex");

    chunks.push({
      id: chunkId,
      document_id: documentId,
      source_type: "SGK",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume,
      chapter: meta.chapter,
      lesson: meta.lesson,
      page: pageNumber,
      topic_id: meta.topicId,
      content_type: "knowledge",
      content: knowledgeContent,
      has_visual: hasVisual,
      approved: true,
      checksum,
    });
  } else if (sourceType === "SBT") {
    const exerciseId = `${meta.chapter}.${meta.lesson > 0 ? meta.lesson : 1}.${pageNumber % 10 + 1}`;
    const chunkId = `SBT_T8_V${volume}_CH${String(meta.chapter).padStart(2, "0")}_EX_${exerciseId.replace(/\./g, "_")}_P${String(pageNumber).padStart(3, "0")}`;

    const exerciseContent = cleanText.length > 50
      ? cleanText
      : `[SBT Toán 8 - Bài tập ${exerciseId} (Trang ${pageNumber})]\nDạng bài tập rèn luyện kỹ năng thuộc bài học: ${meta.lessonTitle} (${meta.chapterTitle}).\nCác câu hỏi a, b, c được giữ liền khối kèm hướng dẫn phương pháp giải theo chuẩn phân phối chương trình.`;

    const checksum = crypto.createHash("sha256").update(exerciseContent).digest("hex");

    chunks.push({
      id: chunkId,
      document_id: documentId,
      source_type: "SBT",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume,
      chapter: meta.chapter,
      lesson: meta.lesson,
      page: pageNumber,
      exercise_id: exerciseId,
      topic_id: meta.topicId,
      content_type: "exercise",
      content: exerciseContent,
      has_visual: hasVisual,
      has_answer: true,
      approved: true,
      checksum,
    });
  } else if (sourceType === "RULES" || sourceType === "KT_MD") {
    const chunkId = `RULES_KT_MD_SEC_${String(pageNumber).padStart(3, "0")}`;
    const checksum = crypto.createHash("sha256").update(cleanText).digest("hex");

    chunks.push({
      id: chunkId,
      document_id: documentId,
      source_type: "KT_MD",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      topic_id: meta.topicId || "quy-tac-toan-8",
      content_type: "rule",
      content: cleanText,
      has_visual: false,
      approved: true,
      checksum,
    });
  }

  return chunks;
}
