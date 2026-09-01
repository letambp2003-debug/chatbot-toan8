import { MathDomain, SourceType } from "@/types/knowledge";

export type ScopeDecision = "IN_SCOPE" | "OUT_OF_SCOPE" | "UNCERTAIN";

export type ScopeIntent =
  | "EXPLAIN"
  | "SOLVE"
  | "HINT"
  | "PRACTICE"
  | "QUIZ"
  | "CHECK_ANSWER"
  | "FIND_EXERCISE";

export interface ScopeGuardResult {
  decision: ScopeDecision;
  grade: number | null;
  domain: MathDomain;
  topic_id: string | null;
  intent: ScopeIntent;
  sources_needed: SourceType[];
  confidence: number;
  reason: string;
}
