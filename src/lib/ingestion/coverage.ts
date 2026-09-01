import type { KnowledgeDocument, KnowledgeChunk } from "../../types/knowledge.ts";

export interface DocumentCoverageSummary {
  filename: string;
  sourceType: string;
  volume?: number;
  totalPages: number;
  processedPages: number;
  failedPages: number;
  totalChunks: number;
  visualPages: number;
  exercises: number;
  status: "indexed" | "processing" | "failed";
}

export interface CoverageReport {
  document_pages: number;
  processed_pages: number;
  failed_pages: number;
  chunks: number;
  visual_pages: number;
  unmapped_chunks: number;
  duplicate_chunks: number;
  exercises: number;
  mapped_exercises: number;
  unmapped_exercises: number;
  topic_distribution: Record<string, number>;
  documents: DocumentCoverageSummary[];
  status: "READY" | "NOT_READY";
  gate_checks: {
    no_failed_pages: boolean;
    no_unmapped_chunks: boolean;
    no_unmapped_exercises: boolean;
  };
  generated_at: string;
}

export function computeCoverageReport(
  documents: KnowledgeDocument[],
  chunks: KnowledgeChunk[],
  visualPageCount: number = 0,
  failedPagesCount: number = 0
): CoverageReport {
  const document_pages = documents.reduce((sum, d) => sum + (d.page_count || 0), 0);
  const processed_pages = documents.reduce((sum, d) => sum + (d.processed_page_count || 0), 0);
  const failed_pages = failedPagesCount;
  const totalChunks = chunks.length;

  let unmapped_chunks = 0;
  const chunkIds = new Set<string>();
  let duplicate_chunks = 0;
  const topic_distribution: Record<string, number> = {};

  let total_exercises = 0;
  let mapped_exercises = 0;
  let unmapped_exercises = 0;

  for (const chunk of chunks) {
    if (chunkIds.has(chunk.id)) {
      duplicate_chunks++;
    } else {
      chunkIds.add(chunk.id);
    }

    if (!chunk.topic_id || chunk.topic_id.trim() === "") {
      unmapped_chunks++;
    } else {
      topic_distribution[chunk.topic_id] = (topic_distribution[chunk.topic_id] || 0) + 1;
    }

    if (chunk.content_type === "exercise" || chunk.exercise_id) {
      total_exercises++;
      if (chunk.topic_id && chunk.topic_id.trim() !== "") {
        mapped_exercises++;
      } else {
        unmapped_exercises++;
      }
    }
  }

  const no_failed_pages = failed_pages === 0;
  const no_unmapped_chunks = unmapped_chunks === 0;
  const no_unmapped_exercises = unmapped_exercises === 0;

  const isReady = no_failed_pages && no_unmapped_chunks && no_unmapped_exercises && processed_pages > 0;

  const docSummaries: DocumentCoverageSummary[] = documents.map((doc) => {
    const docChunks = chunks.filter((c) => c.document_id === doc.id);
    const docExercises = docChunks.filter((c) => c.content_type === "exercise" || c.exercise_id).length;
    const docVisual = docChunks.filter((c) => c.has_visual).length;

    return {
      filename: doc.filename,
      sourceType: doc.source_type,
      volume: doc.volume,
      totalPages: doc.page_count,
      processedPages: doc.processed_page_count,
      failedPages: 0,
      totalChunks: docChunks.length,
      visualPages: docVisual,
      exercises: docExercises,
      status: doc.status === "indexed" ? "indexed" : "processing",
    };
  });

  return {
    document_pages,
    processed_pages,
    failed_pages,
    chunks: totalChunks,
    visual_pages: visualPageCount,
    unmapped_chunks,
    duplicate_chunks,
    exercises: total_exercises,
    mapped_exercises,
    unmapped_exercises,
    topic_distribution,
    documents: docSummaries,
    status: isReady ? "READY" : "NOT_READY",
    gate_checks: {
      no_failed_pages,
      no_unmapped_chunks,
      no_unmapped_exercises,
    },
    generated_at: new Date().toISOString(),
  };
}
