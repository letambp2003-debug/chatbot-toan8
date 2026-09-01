import { SourceCitation } from "./knowledge";

export type LearningMode =
  | "EXPLAIN"
  | "SOLVE"
  | "HINT"
  | "PRACTICE"
  | "QUIZ"
  | "CHECK_ANSWER"
  | "FIND_EXERCISE";

export type ScopeDecision = "IN_SCOPE" | "OUT_OF_SCOPE" | "UNCERTAIN";

export type MathDomain =
  | "ALGEBRA"
  | "GEOMETRY"
  | "STATISTICS_PROBABILITY"
  | "OTHER";

export interface ScopeGuardResult {
  decision: ScopeDecision;
  grade: number | null;
  domain: MathDomain;
  topic_id?: string | null;
  intent: LearningMode;
  confidence: number;
  reason?: string;
  sources_needed?: ("SGK" | "SBT" | "KT_MD")[];
}

export interface AnswerVerificationResult {
  scope_ok: boolean;
  source_supported: boolean;
  calculation_ok: boolean;
  formula_ok: boolean;
  logic_ok: boolean;
  grade8_method: boolean;
  citation_ok: boolean;
  needs_regeneration: boolean;
  feedback?: string;
}

export type MessageSource = SourceCitation;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: SourceCitation[];
  mode?: LearningMode;
  created_at: string;
  imageUrl?: string;
}

export interface LearningProgress {
  answered: number;
  correct: number;
  percent: number;
  label: string;
  last_topic?: string;
}
