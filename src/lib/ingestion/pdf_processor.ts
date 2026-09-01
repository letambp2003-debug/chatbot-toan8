import fs from "fs";
import path from "path";
import crypto from "crypto";
import pdf from "pdf-parse";
import type { KnowledgeDocument, KnowledgeChunk, BookSet, SourceType } from "../../types/knowledge.ts";
import { chunkPageSemantically } from "./semantic_chunker.ts";
import { logger } from "../security/logger.ts";

export interface ProcessedDocumentResult {
  document: KnowledgeDocument;
  chunks: KnowledgeChunk[];
  pages: { pageNumber: number; textLength: number; isVisual: boolean }[];
}

export function computeFileChecksum(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

export async function processPdfDocument(
  filePath: string,
  sourceType: SourceType,
  bookSet: BookSet,
  volume: 1 | 2
): Promise<ProcessedDocumentResult> {
  const filename = path.basename(filePath);
  const checksum = computeFileChecksum(filePath);
  const dataBuffer = fs.readFileSync(filePath);

  const rawPages: { pageNumber: number; text: string }[] = [];
  let pageCounter = 1;

  const options = {
    pagerender: async function (pageData: any) {
      const textContent = await pageData.getTextContent();
      let text = "";
      for (const item of textContent.items) {
        text += item.str + " ";
      }
      rawPages.push({
        pageNumber: pageCounter++,
        text: text.trim(),
      });
      return text;
    },
  };

  const parsedPdf = await pdf(dataBuffer, options);
  const totalPages = parsedPdf.numpages || rawPages.length;

  const docId = crypto.randomUUID();
  const doc: KnowledgeDocument = {
    id: docId,
    source_type: sourceType,
    book_set: bookSet,
    grade: 8,
    subject: "Toán",
    volume,
    filename,
    checksum,
    page_count: totalPages,
    processed_page_count: totalPages,
    status: "indexed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const allChunks: KnowledgeChunk[] = [];
  const pageStats: { pageNumber: number; textLength: number; isVisual: boolean }[] = [];

  for (const page of rawPages) {
    const isLowText = page.text.length < 80 || page.text.includes("timdapan.com");
    pageStats.push({
      pageNumber: page.pageNumber,
      textLength: page.text.length,
      isVisual: isLowText,
    });

    const pageChunks = chunkPageSemantically({
      documentId: docId,
      sourceType,
      bookSet,
      volume,
      pageNumber: page.pageNumber,
      rawText: page.text,
      isLowText,
    });

    allChunks.push(...pageChunks);
  }

  logger.info(`Đã xử lý xong tệp ${filename}: ${totalPages} trang, ${allChunks.length} chunks tạo lập.`);

  return {
    document: doc,
    chunks: allChunks,
    pages: pageStats,
  };
}

export function processRulesDocument(filePath: string): ProcessedDocumentResult {
  const filename = path.basename(filePath);
  const checksum = computeFileChecksum(filePath);
  const content = fs.readFileSync(filePath, "utf8");

  const docId = crypto.randomUUID();
  const doc: KnowledgeDocument = {
    id: docId,
    source_type: "KT_MD",
    book_set: "KNTT",
    grade: 8,
    subject: "Toán",
    filename,
    checksum,
    page_count: 1,
    processed_page_count: 1,
    status: "indexed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sections = content.split(/^#+\s+/m).filter((s) => s.trim().length > 0);
  const allChunks: KnowledgeChunk[] = [];

  sections.forEach((sec, idx) => {
    const lines = sec.trim().split("\n");
    const heading = lines[0]?.trim() || `Phần ${idx + 1}`;
    const body = lines.slice(1).join("\n").trim();
    const fullText = `[QUY TẮC TOÁN 8 - ${heading}]\n${body}`;
    const chunkChecksum = crypto.createHash("sha256").update(fullText).digest("hex");

    allChunks.push({
      id: `RULES_KT_MD_SEC_${String(idx + 1).padStart(3, "0")}`,
      document_id: docId,
      source_type: "KT_MD",
      grade: 8,
      subject: "Toán",
      book_set: "KNTT",
      topic_id: "hang-dang-thuc",
      content_type: "rule",
      content: fullText,
      has_visual: false,
      approved: true,
      checksum: chunkChecksum,
    });
  });

  return {
    document: doc,
    chunks: allChunks,
    pages: [{ pageNumber: 1, textLength: content.length, isVisual: false }],
  };
}
