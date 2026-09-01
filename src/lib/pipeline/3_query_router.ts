import { LearningMode, ScopeGuardResult } from "@/types/chat";
import { SourceType } from "@/types/knowledge";

export interface QueryRouterResult {
  intent: LearningMode;
  prioritySources: SourceType[];
  isExactLookup: boolean;
  lookupMetadata?: {
    exerciseNumber?: string;
    pageNumber?: number;
    chapter?: number;
  };
}

export function runQueryRouter(
  question: string,
  requestedMode: LearningMode,
  scopeResult: ScopeGuardResult
): QueryRouterResult {
  const lower = question.toLowerCase();

  // Kiểm tra xem có phải truy vấn tìm bài tập chính xác không (ví dụ: "bài 12 trang 31 sbt")
  const pageMatch = lower.match(/trang\s*(\d+)/i);
  const exMatch = lower.match(/(?:bài|bài tập)\s*(\d+(?:\.\d+)?)/i);
  const chapMatch = lower.match(/(?:chương|chương\s*)(\d+)/i);

  const isExactLookup = Boolean(pageMatch || exMatch);
  const lookupMetadata = isExactLookup
    ? {
        exerciseNumber: exMatch ? exMatch[1] : undefined,
        pageNumber: pageMatch ? parseInt(pageMatch[1], 10) : undefined,
        chapter: chapMatch ? parseInt(chapMatch[1], 10) : undefined,
      }
    : undefined;

  let prioritySources: SourceType[] = ["SGK", "SBT", "KT_MD"];

  switch (requestedMode) {
    case "EXPLAIN":
      // Ưu tiên SGK giải thích khái niệm, định nghĩa, định lý
      prioritySources = ["SGK", "KT_MD", "SBT"];
      break;

    case "SOLVE":
      // Ưu tiên SBT và SGK có phương pháp giải chuẩn
      prioritySources = ["SBT", "SGK", "KT_MD"];
      break;

    case "HINT":
      // Ưu tiên SGK để gợi ý công thức/bước đầu
      prioritySources = ["SGK", "KT_MD", "SBT"];
      break;

    case "PRACTICE":
      // Ưu tiên SBT làm mẫu các dạng bài
      prioritySources = ["SBT", "SGK", "KT_MD"];
      break;

    case "QUIZ":
      // Ưu tiên SGK và SBT cho trắc nghiệm chuẩn
      prioritySources = ["SGK", "SBT", "KT_MD"];
      break;

    case "CHECK_ANSWER":
      // Ưu tiên SGK & SBT để đối chiếu phương pháp và đáp án
      prioritySources = ["SGK", "SBT", "KT_MD"];
      break;

    default:
      prioritySources = ["SGK", "SBT", "KT_MD"];
      break;
  }

  return {
    intent: requestedMode,
    prioritySources,
    isExactLookup,
    lookupMetadata,
  };
}
