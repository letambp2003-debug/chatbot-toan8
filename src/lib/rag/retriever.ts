import { GoogleGenAI } from "@google/genai";
import { GEMINI_CONFIG } from "../gemini/config.ts";
import { RAG_CONFIG } from "./config.ts";
import type { KnowledgeChunk, BookSet, SourceType } from "../../types/knowledge.ts";
import type { QueryRouterResult } from "../scope/router.ts";
import { BUILTIN_GRADE8_KNOWLEDGE, queryBuiltInKnowledge } from "./knowledge_store.ts";
import { logger } from "../security/logger.ts";

export interface RAGRetrieverOptions {
  question: string;
  bookSet: BookSet;
  chapter?: string;
  topicId?: string;
  routerResult: QueryRouterResult;
  aiClient?: GoogleGenAI;
}

export interface RAGRetrieverResult {
  chunks: KnowledgeChunk[];
  hasVisualContent: boolean;
  insufficientContext: boolean;
  bestScore: number;
}

async function generateQueryEmbedding(aiClient: GoogleGenAI, text: string): Promise<number[] | null> {
  try {
    const response = await aiClient.models.embedContent({
      model: GEMINI_CONFIG.embeddingModel,
      contents: text,
    });

    const values = response.embeddings?.[0]?.values || (response as any).embedding?.values;
    if (Array.isArray(values) && values.length > 0) {
      return values;
    }
    return null;
  } catch (error: any) {
    logger.warn("Embedding generation error, fallback to keyword/metadata retrieval:", error?.message);
    return null;
  }
}

/**
 * Thuật toán Reranking đa yếu tố: Kết hợp Cosine similarity, Khớp Intent & Khớp Metadata
 */
export function rerankKnowledgeChunks(
  candidates: KnowledgeChunk[],
  prioritySources: SourceType[],
  topicId?: string,
  exactExerciseId?: string,
  exactPage?: number,
  limit: number = RAG_CONFIG.finalK
): { chunks: KnowledgeChunk[]; bestScore: number } {
  if (candidates.length === 0) {
    return { chunks: [], bestScore: 0 };
  }

  const scored = candidates.map((chunk) => {
    let score = chunk.similarity || 0.65;

    // 1. Boost khớp chính xác Metadata (Số bài tập hoặc Số trang)
    if (exactExerciseId && chunk.exercise_id === exactExerciseId) {
      score += RAG_CONFIG.exactMatchBoost;
    }
    if (exactPage && chunk.page === exactPage) {
      score += RAG_CONFIG.exactMatchBoost * 0.8;
    }

    // 2. Boost khớp Chủ đề Toán 8
    if (topicId && chunk.topic_id === topicId) {
      score += RAG_CONFIG.topicMatchBoost;
    }

    // 3. Boost thứ tự ưu tiên nguồn theo Intent
    const sourceRank = prioritySources.indexOf(chunk.source_type);
    if (sourceRank === 0) {
      score += RAG_CONFIG.primarySourceBoost;
    } else if (sourceRank === 1) {
      score += RAG_CONFIG.secondarySourceBoost;
    }

    return { chunk, score };
  });

  // Sắp xếp giảm dần theo điểm sau rerank
  scored.sort((a, b) => b.score - a.score);

  const bestScore = scored[0]?.score || 0;
  const filtered = scored
    .filter((item) => item.score >= RAG_CONFIG.minScore)
    .slice(0, limit)
    .map((item) => item.chunk);

  return { chunks: filtered, bestScore };
}

/**
 * Pipeline RAG lai kết hợp Exact Metadata Lookup, pgvector và Reranker
 */
export async function runRAGRetriever(options: RAGRetrieverOptions): Promise<KnowledgeChunk[]> {
  const result = await executeHybridRAG(options);
  return result.chunks;
}

export async function executeHybridRAG(options: RAGRetrieverOptions): Promise<RAGRetrieverResult> {
  const { question, bookSet, chapter, topicId, routerResult, aiClient } = options;
  const metadata = routerResult.lookupMetadata;

  const exactExerciseId = metadata?.exerciseNumber;
  const exactPage = metadata?.pageNumber;
  const chapterNum = chapter ? parseInt(chapter, 10) : metadata?.chapter;

  let candidatePool: KnowledgeChunk[] = [];

  // BƯỚC 1: EXACT METADATA MATCH FIRST (Ưu tiên tra cứu chính xác số bài / trang trước)
  if (exactExerciseId || exactPage) {
    const exactMatches = queryBuiltInKnowledge({
      exerciseNumber: exactExerciseId,
      pageNumber: exactPage,
      chapter: chapterNum,
      bookSet,
    });
    candidatePool.push(...exactMatches);
  }

  // BƯỚC 2: VECTOR SIMILARITY SEARCH (pgvector qua match_knowledge_chunks RPC)
  if (aiClient && candidatePool.length < RAG_CONFIG.topKCandidates) {
    try {
      const queryEmbedding = await generateQueryEmbedding(aiClient, question);

      if (queryEmbedding && queryEmbedding.length > 0) {
        try {
          const { createServerSupabaseClient } = await import("../supabase/server.ts");
          const supabase = createServerSupabaseClient();

          const { data, error } = await supabase.rpc("match_knowledge_chunks", {
            query_embedding: queryEmbedding,
            match_threshold: 0.35,
            match_count: RAG_CONFIG.topKCandidates,
            filter_grade: 8,
            filter_book_set: bookSet,
            filter_chapter: isNaN(chapterNum as any) ? null : chapterNum,
            filter_topic_id: topicId || null,
          });

          if (!error && Array.isArray(data) && data.length > 0) {
            candidatePool.push(...(data as KnowledgeChunk[]));
          }
        } catch {
          // Khi chạy ngoài HTTP server context, chuyển sang built-in knowledge
        }
      }
    } catch (error: any) {
      logger.warn("Supabase pgvector search warning:", error?.message);
    }
  }

  // Fallback: Nạp thêm từ Built-in Knowledge Store nếu pool chưa đủ 12 candidates
  if (candidatePool.length < RAG_CONFIG.topKCandidates) {
    const builtInCandidates = queryBuiltInKnowledge({
      topicId,
      chapter: chapterNum,
      bookSet,
    });
    candidatePool.push(...builtInCandidates);
  }

  // Loại bỏ các chunks trùng lặp theo ID
  const uniqueCandidateMap = new Map<string, KnowledgeChunk>();
  for (const c of candidatePool) {
    if (!uniqueCandidateMap.has(c.id) && c.approved) {
      uniqueCandidateMap.set(c.id, c);
    }
  }
  const uniqueCandidates = Array.from(uniqueCandidateMap.values()).slice(0, RAG_CONFIG.topKCandidates);

  // BƯỚC 3 & 4: RERANK VÀ CHỌN BEST 4-6 CHUNKS
  const { chunks: rerankedChunks, bestScore } = rerankKnowledgeChunks(
    uniqueCandidates,
    routerResult.prioritySources,
    topicId,
    exactExerciseId,
    exactPage,
    RAG_CONFIG.finalK
  );

  // BƯỚC 5: KIỂM TRA ĐIỀU KIỆN CONFIDENCE / INSUFFICIENT CONTEXT
  const insufficientContext = rerankedChunks.length === 0 || bestScore < RAG_CONFIG.minScore;

  // BƯỚC 6: NHẬN DIỆN NGỮ CẢNH ĐA PHƯƠNG THỨC (HÌNH ẢNH / BIỂU ĐỒ)
  const questionHasVisualKeywords = /hình vẽ|biểu đồ|tam giác|tứ giác|hình thang|hình bình hành|hình thoi|hình vuông|hình chóp|đồ thị/i.test(question);
  const chunksHaveVisual = rerankedChunks.some((c) => c.has_visual);
  const hasVisualContent = questionHasVisualKeywords || chunksHaveVisual;

  logger.info(
    `RAG Retrieval hoàn tất: ${rerankedChunks.length} chunks được chọn (Best score: ${bestScore.toFixed(2)}, Visual: ${hasVisualContent}, Insufficient: ${insufficientContext})`
  );

  return {
    chunks: rerankedChunks,
    hasVisualContent,
    insufficientContext,
    bestScore,
  };
}
