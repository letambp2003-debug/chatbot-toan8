import path from "path";
import fs from "fs";
import { processPdfDocument, processRulesDocument } from "./pdf_processor.ts";
import type { ProcessedDocumentResult } from "./pdf_processor.ts";
import { computeCoverageReport } from "./coverage.ts";
import type { CoverageReport } from "./coverage.ts";
import type { KnowledgeDocument, KnowledgeChunk } from "../../types/knowledge.ts";
import { logger } from "../security/logger.ts";

export interface FullIngestionResult {
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
  coverage: CoverageReport;
  durationMs: number;
}

export async function runFullKnowledgeIngestion(): Promise<FullIngestionResult> {
  const startTime = Date.now();
  logger.info("Bắt đầu quy trình Ingestion toàn bộ tài liệu SGK, SBT và Rules...");

  const processedResults: ProcessedDocumentResult[] = [];
  let totalVisualPages = 0;

  // 1. Ingest SGK Tập 1
  const sgkTap1Path = path.resolve("knowledge/sgk/SGK_KNTT 8_TAP 1.pdf");
  if (fs.existsSync(sgkTap1Path)) {
    const res = await processPdfDocument(sgkTap1Path, "SGK", "KNTT", 1);
    processedResults.push(res);
    totalVisualPages += res.pages.filter((p) => p.isVisual).length;
  }

  // 2. Ingest SGK Tập 2
  const sgkTap2Path = path.resolve("knowledge/sgk/SGK_KNTT 8_TAP 2.pdf");
  if (fs.existsSync(sgkTap2Path)) {
    const res = await processPdfDocument(sgkTap2Path, "SGK", "KNTT", 2);
    processedResults.push(res);
    totalVisualPages += res.pages.filter((p) => p.isVisual).length;
  }

  // 3. Ingest SBT Tập 1
  const sbtTap1Path = path.resolve("knowledge/sbt/SBT_KNTT 8_TAP 1.pdf");
  if (fs.existsSync(sbtTap1Path)) {
    const res = await processPdfDocument(sbtTap1Path, "SBT", "KNTT", 1);
    processedResults.push(res);
    totalVisualPages += res.pages.filter((p) => p.isVisual).length;
  }

  // 4. Ingest SBT Tập 2
  const sbtTap2Path = path.resolve("knowledge/sbt/SBT_KNTT 8_TAP 2.pdf");
  if (fs.existsSync(sbtTap2Path)) {
    const res = await processPdfDocument(sbtTap2Path, "SBT", "KNTT", 2);
    processedResults.push(res);
    totalVisualPages += res.pages.filter((p) => p.isVisual).length;
  }

  // 5. Ingest kt.md (source_type = RULES / KT_MD)
  const ktPath = path.resolve("knowledge/kt.md");
  if (fs.existsSync(ktPath)) {
    const res = processRulesDocument(ktPath);
    processedResults.push(res);
  }

  const allDocuments = processedResults.map((r) => r.document);
  const allChunks = processedResults.flatMap((r) => r.chunks);

  const coverage = computeCoverageReport(allDocuments, allChunks, totalVisualPages, 0);

  const durationMs = Date.now() - startTime;
  logger.info(`Hoàn tất Ingestion Pipeline trong ${durationMs}ms: ${allDocuments.length} tài liệu, ${allChunks.length} chunks. Status: ${coverage.status}`);

  return {
    documents: allDocuments,
    chunks: allChunks,
    coverage,
    durationMs,
  };
}
