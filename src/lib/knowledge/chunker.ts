import { BookSet, ContentType, KnowledgeChunk, SourceType } from "./types";

export interface RawPageText {
  pageNumber: number;
  text: string;
  sourceType: SourceType;
  bookSet: BookSet;
  volume: 1 | 2;
}

export function chunkPageContent(rawPage: RawPageText): KnowledgeChunk[] {
  const { pageNumber, text, sourceType, bookSet, volume } = rawPage;
  const chunks: KnowledgeChunk[] = [];

  if (!text || text.trim().length < 10) return chunks;

  const chapterMatch = text.match(/(?:Chương|CHƯƠNG)\s*([IVXLCDM\d]+)/i);
  const lessonMatch = text.match(/(?:Bài|BÀI)\s*(\d+)/i);

  const chapterNum = chapterMatch ? parseRomanOrArabic(chapterMatch[1]) : 1;
  const lessonNum = lessonMatch ? parseInt(lessonMatch[1], 10) : 1;

  let topicId = "toan-8-chung";
  const lower = text.toLowerCase();
  if (lower.includes("hằng đẳng thức") || lower.includes("bình phương") || lower.includes("lập phương")) {
    topicId = "hang-dang-thuc";
  } else if (lower.includes("đơn thức") || lower.includes("đa thức")) {
    topicId = "don-thuc-da-thuc";
  } else if (lower.includes("nhân tử") || lower.includes("phân tích đa thức")) {
    topicId = "phan-tich-da-thuc-thanh-nhan-tu";
  } else if (lower.includes("phân thức")) {
    topicId = "phan-thuc-dai-so";
  } else if (lower.includes("tứ giác") || lower.includes("hình thang") || lower.includes("hình bình hành")) {
    topicId = "tu-giac";
  } else if (lower.includes("thales") || lower.includes("ta-lét")) {
    topicId = "dinh-ly-thales";
  } else if (lower.includes("đồng dạng")) {
    topicId = "tam-giac-dong-dang";
  } else if (lower.includes("phương trình")) {
    topicId = "phuong-trinh-bac-nhat";
  }

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 20);

  if (paragraphs.length === 0) {
    const chunkId = `${sourceType}_T8_T${volume}_CH${String(chapterNum).padStart(2, "0")}_B${String(lessonNum).padStart(2, "0")}_P${String(pageNumber).padStart(3, "0")}_001`;
    chunks.push({
      id: chunkId,
      source_type: sourceType,
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume,
      chapter: chapterNum,
      lesson: lessonNum,
      page: pageNumber,
      topic_id: topicId,
      content_type: sourceType === "SGK" ? "knowledge" : "exercise",
      content: text.trim(),
      has_visual: lower.includes("hình") || lower.includes("biểu đồ"),
      has_answer: sourceType === "SBT",
      approved: true,
    });
    return chunks;
  }

  paragraphs.forEach((para, idx) => {
    const chunkId = `${sourceType}_T8_T${volume}_CH${String(chapterNum).padStart(2, "0")}_B${String(lessonNum).padStart(2, "0")}_P${String(pageNumber).padStart(3, "0")}_${String(idx + 1).padStart(3, "0")}`;
    const contentType: ContentType =
      sourceType === "SGK" ? (para.includes("Ví dụ") ? "example" : "knowledge") : "exercise";

    chunks.push({
      id: chunkId,
      source_type: sourceType,
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume,
      chapter: chapterNum,
      lesson: lessonNum,
      page: pageNumber,
      topic_id: topicId,
      content_type: contentType,
      content: para.trim(),
      has_visual: para.includes("hình") || para.includes("biểu đồ"),
      has_answer: sourceType === "SBT",
      approved: true,
    });
  });

  return chunks;
}

function parseRomanOrArabic(val: string): number {
  const romanMap: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
  };
  const upper = val.toUpperCase().trim();
  if (romanMap[upper]) return romanMap[upper];
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 1 : parsed;
}
