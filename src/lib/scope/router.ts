import type { LearningMode } from "../../types/chat.ts";
import type { SourceType } from "../../types/knowledge.ts";
import type { ScopeGuardResult } from "./types.ts";

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
      prioritySources = ["SGK", "KT_MD", "SBT"];
      break;

    case "SOLVE":
      prioritySources = ["SBT", "SGK", "KT_MD"];
      break;

    case "HINT":
      prioritySources = ["SGK", "KT_MD", "SBT"];
      break;

    case "PRACTICE":
      prioritySources = ["SBT", "SGK", "KT_MD"];
      break;

    case "QUIZ":
      prioritySources = ["SGK", "SBT", "KT_MD"];
      break;

    case "CHECK_ANSWER":
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

export function routeQuery(options: {
  question: string;
  mode: LearningMode;
  scopeResult: ScopeGuardResult;
}): QueryRouterResult {
  return runQueryRouter(options.question, options.mode, options.scopeResult);
}
