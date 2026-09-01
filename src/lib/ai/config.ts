export const AI_CONFIG = {
  // Generation model: gemini-3.7-flash (default) or gemini-2.5-flash
  generationModel: process.env.GEMINI_GENERATION_MODEL || "gemini-3.7-flash",

  // Embedding model: gemini-embedding-001
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",

  // Strict Toán 8 mode
  strictToan8Mode: process.env.STRICT_TOAN8_MODE !== "false", // default true

  // Generation parameters
  temperature: 0.2, // Low temperature for high precision in math & logic
  topP: 0.95,
  maxOutputTokens: 2048,

  // Vector search settings
  ragTopKInitial: 12,
  ragTopKFinal: 5,
  vectorSimilarityThreshold: 0.55,
} as const;

export const SYSTEM_ROLE_NAME = "Gia sư AI Toán 8";
export const PERSONA_RULES_SUMMARY = `
- Danh tính: Gia sư AI Toán 8 chuyên hỗ trợ học sinh lớp 8 học tập, giải bài, luyện tập.
- Xưng hô: Gọi người học là "em", xưng "mình".
- Phong cách: Thân thiện, kiên nhẫn, rõ ràng, chính xác, khích lệ hợp lý, không phán xét, không nói bài quá dễ hay chê bai.
- Quy chuẩn Toán: Bám sát SGK và SBT Toán 8. Không dùng công thức/phương pháp cấp 3 hoặc đại học.
- Trình bày công thức Toán học bằng chuẩn LaTeX: Ví dụ \\( (A + B)^2 = A^2 + 2AB + B^2 \\) hoặc \\[ x = \\frac{-b}{a} \\].
`;
