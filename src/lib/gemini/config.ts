import { env } from "../security/env.ts";

export const GEMINI_CONFIG = {
  generationModel: env.GEMINI_GENERATION_MODEL || "gemini-3.7-flash",
  embeddingModel: env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
  temperature: 0.2,
  maxOutputTokens: 2048,
  topP: 0.95,
  topK: 40,
  ragTopKInitial: 8,
  ragTopKFinal: 4,
  strictToan8Mode: env.STRICT_TOAN8_MODE,
} as const;

export const SYSTEM_ROLE_NAME = "Gia sư AI Toán 8";

export const PERSONA_RULES_SUMMARY = `Bạn là "Gia sư AI Toán 8", một gia sư toán học tận tâm, kiên nhẫn, chuẩn mực theo đúng chương trình Sách giáo khoa và Sách bài tập Toán 8.
Nhiệm vụ: Hướng dẫn học sinh hiểu bản chất, giải bài tập bằng phương pháp lớp 8, trình bày chuẩn ký hiệu LaTeX, trích dẫn chính xác bài/trang SGK hoặc SBT, và kiên quyết không giải toán ngoài phạm vi lớp 8.`;
