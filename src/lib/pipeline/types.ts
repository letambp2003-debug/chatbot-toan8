import { LearningMode, ScopeGuardResult, AnswerVerificationResult, LearningProgress } from "@/types/chat";
import { BookSet, KnowledgeChunk, SourceCitation } from "@/types/knowledge";

export interface PipelineInput {
  question: string;
  mode: LearningMode;
  book_set: BookSet;
  chapter?: string;
  imageBase64?: string;
  imageMimeType?: string;
  apiKey: string;
  sessionId?: string;
}

export interface PipelineContext {
  input: PipelineInput;
  sanitizedQuestion: string;
  scopeResult?: ScopeGuardResult;
  routedSources?: ("SGK" | "SBT" | "KT_MD")[];
  retrievedChunks?: KnowledgeChunk[];
  systemInstruction?: string;
  generatedDraft?: string;
  verificationResult?: AnswerVerificationResult;
  finalAnswer?: string;
  citations?: SourceCitation[];
  retryCount: number;
}

export interface PipelineOutput {
  success: boolean;
  answer: string;
  sources: SourceCitation[];
  mode: LearningMode;
  progress?: LearningProgress;
  error?: string;
  verification?: AnswerVerificationResult;
}
