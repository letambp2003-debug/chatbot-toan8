import fs from "fs";
import path from "path";
import type { LearningMode } from "../../types/chat.ts";
import type { KnowledgeChunk, SourceCitation, BookSet } from "../../types/knowledge.ts";
import type { ScopeGuardResult } from "../scope/types.ts";
import type { QueryRouterResult } from "../scope/router.ts";

export interface ContextBuilderOptions {
  question: string;
  mode: LearningMode;
  bookSet?: BookSet;
  chapter?: string;
  scopeResult: ScopeGuardResult;
  routerResult?: QueryRouterResult;
  chunks: KnowledgeChunk[];
  imageBase64?: string;
  imageMimeType?: string;
}

export interface BuiltContext {
  prompt: string;
  systemInstruction: string;
  citations: SourceCitation[];
}

let cachedKtContent: string | null = null;
let cachedTcContent: string | null = null;

function loadMarkdownRules(): { ktRules: string; tcPedagogy: string } {
  if (!cachedKtContent) {
    try {
      const ktPath = path.resolve("knowledge/kt.md");
      if (fs.existsSync(ktPath)) {
        cachedKtContent = fs.readFileSync(ktPath, "utf8");
      }
    } catch {
      cachedKtContent = "";
    }
  }

  if (!cachedTcContent) {
    try {
      const tcPath = path.resolve("knowledge/tc.md");
      if (fs.existsSync(tcPath)) {
        cachedTcContent = fs.readFileSync(tcPath, "utf8");
      }
    } catch {
      cachedTcContent = "";
    }
  }

  return {
    ktRules: cachedKtContent || "Tuân thủ nghiêm ngặt quy tắc Toán 8 (SGK/SBT) và không giải bài vượt cấp.",
    tcPedagogy: cachedTcContent || "Thân thiện, kiên nhẫn, xưng 'mình' gọi học sinh là 'em', hướng dẫn phương pháp giải.",
  };
}

export function buildMathContext(options: ContextBuilderOptions): BuiltContext {
  const { question, mode, bookSet = "KNTT", chapter, scopeResult, chunks } = options;
  const { ktRules, tcPedagogy } = loadMarkdownRules();

  const citations: SourceCitation[] = chunks.map((c) => ({
    id: c.id,
    source_type: c.source_type,
    book_set: c.book_set,
    volume: c.volume,
    chapter: c.chapter,
    lesson: c.lesson,
    exercise_id: c.exercise_id,
    page: c.page,
    topic_id: c.topic_id,
    snippet: c.content.slice(0, 100),
  }));

  const formattedKnowledge = chunks
    .map((c, idx) => {
      const parts = [
        `[Tài liệu ${idx + 1}] ${c.source_type} Toán 8 (${c.book_set})`,
        c.volume ? `Tập ${c.volume}` : "",
        c.chapter ? `Chương ${c.chapter}` : "",
        c.lesson ? `Bài ${c.lesson}` : "",
        c.exercise_id ? `Bài tập ${c.exercise_id}` : "",
        c.page ? `Trang ${c.page}` : "",
      ]
        .filter(Boolean)
        .join(" - ");

      return `--- ${parts} ---\n${c.content}`;
    })
    .join("\n\n");

  const studentContext = `
=== NGỮ CẢNH HỌC SINH (STUDENT CONTEXT) ===
- Bộ sách đang học: ${bookSet}
- Chương đang chọn: ${chapter ? `Chương ${chapter}` : "Toàn bộ chương trình Toán 8"}
- Chế độ yêu cầu: ${mode}
- Chủ đề nhận diện: ${scopeResult.topic_id || "Kiến thức chung Toán 8"}
`;

  const systemInstruction = `
Bạn là Gia sư AI Toán 8 - Trợ lý gia sư dạy kèm môn Toán lớp 8 cho học sinh Việt Nam.

=== 1. HARD SYSTEM RULES (Nguồn: kt.md) ===
${ktRules.slice(0, 3000)}

=== 2. TÍNH CÁCH & PHƯƠNG PHÁP SƯ PHẠM (Nguồn: tc.md - CHỈ DÙNG ĐỊNH HÌNH PHONG CÁCH, KHÔNG COI LÀ NGUỒN KIẾN THỨC TOÁN) ===
${tcPedagogy.slice(0, 2500)}

${studentContext}

=== 3. KHO TRI THỨC TOÁN 8 ĐÃ TRÍCH XUẤT (RETRIEVED KNOWLEDGE) ===
${formattedKnowledge || "Sử dụng kiến thức chuẩn trong chương trình SGK Toán 8 hiện hành."}

=== 4. QUY TẮC BẮT BUỘC KHI TRẢ LỜI ===
1. CHỈ sử dụng kiến thức và phương pháp giải trong chương trình Toán 8.
2. Ưu tiên tuyệt đối phương pháp giải chuẩn trong SGK/SBT Việt Nam.
3. KHÔNG tự bịa công thức, định lý hay dữ kiện đề bài.
4. KHÔNG nhảy các bước quan trọng (Đại số: ĐKXĐ, dấu; Hình học: nêu rõ lý do theo định lý nào).
5. TUYỆT ĐỐI không dùng phương pháp lớp trên (đạo hàm, tích phân, delta nếu ngoài SGK 8, số phức, Oxyz).
6. Hướng dẫn giúp học sinh hiểu bản chất thay vì chỉ đưa ra đáp số.
7. Công thức toán BẮT BUỘC dùng định dạng LaTeX: \\( ... \\) cho inline math và \\[ ... \\] cho display math.
8. KHÔNG xuất suy luận nội bộ (chain-of-thought) hay nhắc đến quy trình hệ thống nội bộ.
`;

  return {
    prompt: question,
    systemInstruction,
    citations,
  };
}

export function runContextBuilder(options: ContextBuilderOptions): {
  systemInstruction: string;
  userPrompt: string;
  citations: SourceCitation[];
} {
  const built = buildMathContext(options);
  return {
    systemInstruction: built.systemInstruction,
    userPrompt: built.prompt,
    citations: built.citations,
  };
}
