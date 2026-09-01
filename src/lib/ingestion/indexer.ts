import { getAdminGenAIClient } from "@/lib/gemini/client";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { KnowledgeChunk } from "@/types/knowledge";
import { logger } from "@/lib/security/logger";

export async function indexKnowledgeChunks(chunks: KnowledgeChunk[]): Promise<{ indexed: number; failed: number }> {
  if (!chunks || chunks.length === 0) {
    return { indexed: 0, failed: 0 };
  }

  const aiClient = getAdminGenAIClient();
  const supabase = createAdminSupabaseClient();
  let indexed = 0;
  let failed = 0;

  for (const chunk of chunks) {
    try {
      const embedResponse = await aiClient.models.embedContent({
        model: GEMINI_CONFIG.embeddingModel,
        contents: chunk.content,
      });

      const embeddingValues = embedResponse.embeddings?.[0]?.values || (embedResponse as any).embedding?.values;
      if (!embeddingValues) {
        failed++;
        continue;
      }

      const { error } = await supabase.from("knowledge_chunks").upsert(
        {
          id: chunk.id,
          source_type: chunk.source_type,
          grade: chunk.grade,
          subject: chunk.subject,
          book_set: chunk.book_set,
          volume: chunk.volume,
          chapter: chunk.chapter,
          lesson: chunk.lesson,
          page: chunk.page,
          exercise_id: chunk.exercise_id,
          topic_id: chunk.topic_id,
          content_type: chunk.content_type,
          content: chunk.content,
          has_visual: chunk.has_visual,
          has_answer: chunk.has_answer,
          approved: chunk.approved,
          embedding: embeddingValues,
        },
        { onConflict: "id" }
      );

      if (error) {
        logger.error(`Error inserting chunk ${chunk.id}:`, error.message);
        failed++;
      } else {
        indexed++;
      }
    } catch (err: any) {
      logger.error(`Failed to index chunk ${chunk.id}:`, err?.message);
      failed++;
    }
  }

  return { indexed, failed };
}
