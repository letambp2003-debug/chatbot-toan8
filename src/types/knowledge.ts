export type SourceType = "SGK" | "SBT" | "KT_MD" | "TC_MD";

export type BookSet = "KNTT" | "CTST" | "CD";

export type ContentType = "knowledge" | "exercise" | "rule" | "pedagogy" | "example";

export type DocumentStatus = "pending" | "processing" | "indexed" | "failed";

export type MathDomain = "ALGEBRA" | "GEOMETRY" | "STATISTICS_PROBABILITY" | "OTHER";

export type UserRole = "student" | "teacher" | "admin";

export type DifficultyLevel = "easy" | "medium" | "hard" | "advanced";

// 1. PROFILES
export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  role: UserRole;
  grade: number;
  school?: string;
  created_at: string;
  updated_at: string;
}

// 2. TOPICS
export interface Topic {
  id: string;
  title: string;
  domain: MathDomain;
  chapter?: number;
  description?: string;
  created_at?: string;
}

// 3. KNOWLEDGE_DOCUMENTS
export interface KnowledgeDocument {
  id: string;
  source_type: SourceType;
  book_set: BookSet;
  grade: 8;
  subject: "Toán";
  volume?: 1 | 2;
  filename: string;
  checksum?: string;
  page_count: number;
  processed_page_count: number;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}

// 4. KNOWLEDGE_CHUNKS
export interface KnowledgeChunk {
  id: string;
  document_id?: string;
  source_type: SourceType;
  grade: 8;
  subject: "Toán";
  book_set: BookSet;
  volume?: 1 | 2;
  chapter?: number;
  lesson?: number;
  page?: number;
  topic_id?: string;
  exercise_id?: string;
  content_type: ContentType;
  content: string;
  embedding?: number[];
  has_visual?: boolean;
  has_answer?: boolean;
  image_path?: string;
  approved: boolean;
  checksum?: string;
  similarity?: number;
  created_at?: string;
}

// 5. EXERCISES
export interface Exercise {
  id: string;
  topic_id?: string;
  source_type: "SGK" | "SBT";
  book_set: BookSet;
  volume?: 1 | 2;
  chapter?: number;
  lesson?: number;
  exercise_num: string;
  page?: number;
  question_text: string;
  has_visual: boolean;
  image_url?: string;
  difficulty_level: DifficultyLevel;
  solution_text?: string;
  answer_key?: string;
  created_at?: string;
}

// 6. INGESTION_RUNS
export interface IngestionRun {
  id: string;
  started_at: string;
  completed_at?: string;
  status: "running" | "completed" | "failed";
  total_documents: number;
  total_chunks_created: number;
  created_by?: string;
}

// 7. INGESTION_ERRORS
export interface IngestionError {
  id: string;
  run_id: string;
  document_id: string;
  page_number?: number;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  created_at: string;
}

// 8. CHAT_SESSIONS
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  book_set: BookSet;
  chapter?: number;
  mode: string;
  created_at: string;
  updated_at: string;
}

// 9. CHAT_MESSAGES
export interface ChatMessageRow {
  id: string;
  session_id: string;
  sender_role: "user" | "assistant" | "system";
  content: string;
  sources?: SourceCitation[];
  verification_result?: any;
  image_url?: string;
  created_at: string;
}

// 10. LEARNING_PROGRESS
export interface LearningProgressRow {
  id: string;
  user_id: string;
  topic_id: string;
  mode: string;
  answered_count: number;
  correct_count: number;
  last_activity_at: string;
}

// 11. STUDENT_MISTAKES
export interface StudentMistake {
  id: string;
  user_id: string;
  topic_id?: string;
  mistake_type: string;
  context_snippet?: string;
  correction_advice?: string;
  created_at: string;
}

// 12. EVALUATION_CASES
export interface EvaluationCase {
  id: string;
  question: string;
  expected_topic_id: string;
  expected_mode: string;
  ground_truth_answer: string;
  expected_citations?: SourceCitation[];
  created_at?: string;
}

// 13. EVALUATION_RUNS
export interface EvaluationRun {
  id: string;
  run_at: string;
  total_cases: number;
  passed_cases: number;
  accuracy_score: number;
  metrics: Record<string, any>;
  model_name: string;
}

export interface SourceCitation {
  id?: string;
  source_type: SourceType;
  book_set?: BookSet;
  volume?: number;
  chapter?: number;
  lesson?: number;
  exercise_id?: string;
  page?: number;
  topic_id?: string;
  snippet?: string;
  title?: string;
}
