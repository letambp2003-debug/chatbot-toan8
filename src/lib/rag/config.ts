/**
 * RAG Centralized Configuration Module
 * Không hard-code các ngưỡng tìm kiếm ở nhiều file.
 */

export const RAG_CONFIG = {
  // Số lượng ứng viên ban đầu cần truy xuất từ pgvector / exact match
  topKCandidates: 12,

  // Số lượng chunks tốt nhất sau khi Rerank được đưa vào prompt context
  finalK: 6,

  // Ngưỡng điểm similarity tối thiểu để chấp nhận chunk tri thức
  minScore: 0.60,

  // Điểm cộng ưu tiên cho khớp chính xác metadata (số bài, số trang)
  exactMatchBoost: 0.40,

  // Điểm cộng ưu tiên khi khớp chính xác topic_id
  topicMatchBoost: 0.25,

  // Điểm cộng ưu tiên nguồn hàng đầu theo Intent (SGK cho EXPLAIN, SBT cho SOLVE/PRACTICE)
  primarySourceBoost: 0.15,

  // Điểm cộng ưu tiên nguồn thứ hai theo Intent
  secondarySourceBoost: 0.08,
} as const;

export type RagConfig = typeof RAG_CONFIG;
