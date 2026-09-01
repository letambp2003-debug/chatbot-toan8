-- ============================================================================
-- GIA SƯ AI TOÁN 8 - PHASE 3 DATABASE SCHEMA & MIGRATIONS
-- Supabase PostgreSQL + pgvector + Row Level Security (RLS)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CORE DOMAIN TABLES
-- ============================================================================

-- 2.1 PROFILES (Thông tin người dùng / học sinh / giáo viên)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    grade INT DEFAULT 8,
    school TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 TOPICS (Danh mục phân loại kiến thức Toán 8)
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY, -- vd: hang-dang-thuc, don-thuc-da-thuc, dinh-ly-thales
    title TEXT NOT NULL,
    domain TEXT NOT NULL CHECK (domain IN ('ALGEBRA', 'GEOMETRY', 'STATISTICS_PROBABILITY', 'OTHER')),
    chapter INT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 KNOWLEDGE_DOCUMENTS (Quản lý các tệp tài liệu SGK, SBT, KT_MD, TC_MD)
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type TEXT NOT NULL CHECK (source_type IN ('SGK', 'SBT', 'KT_MD', 'TC_MD')),
    book_set TEXT NOT NULL DEFAULT 'KNTT' CHECK (book_set IN ('KNTT', 'CTST', 'CD')),
    grade INT NOT NULL DEFAULT 8 CHECK (grade = 8),
    subject TEXT NOT NULL DEFAULT 'Toán',
    volume INT CHECK (volume IN (1, 2)),
    filename TEXT NOT NULL,
    checksum TEXT, -- SHA-256 hash của tệp PDF / Markdown
    page_count INT DEFAULT 0,
    processed_page_count INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'indexed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 KNOWLEDGE_CHUNKS (Chunks tri thức & Vector Embeddings 768 chiều)
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id TEXT PRIMARY KEY, -- vd: SGK_T8_T1_CH02_B03_P038_001
    document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('SGK', 'SBT', 'KT_MD', 'TC_MD')),
    grade INT NOT NULL DEFAULT 8 CHECK (grade = 8),
    book_set TEXT NOT NULL DEFAULT 'KNTT' CHECK (book_set IN ('KNTT', 'CTST', 'CD')),
    volume INT CHECK (volume IN (1, 2)),
    chapter INT,
    lesson INT,
    page INT,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
    exercise_id TEXT,
    content_type TEXT NOT NULL DEFAULT 'knowledge' CHECK (content_type IN ('knowledge', 'exercise', 'rule', 'pedagogy', 'example')),
    content TEXT NOT NULL,
    embedding VECTOR(768), -- Google gemini-embedding-001 (768 dimensions)
    has_visual BOOLEAN DEFAULT FALSE,
    image_path TEXT,
    approved BOOLEAN DEFAULT TRUE,
    checksum TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 EXERCISES (Kho bài tập chuẩn Toán 8 từ SBT & SGK)
CREATE TABLE IF NOT EXISTS public.exercises (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('SGK', 'SBT')),
    book_set TEXT NOT NULL DEFAULT 'KNTT' CHECK (book_set IN ('KNTT', 'CTST', 'CD')),
    volume INT CHECK (volume IN (1, 2)),
    chapter INT,
    lesson INT,
    exercise_num TEXT NOT NULL,
    page INT,
    question_text TEXT NOT NULL,
    has_visual BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    difficulty_level TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'advanced')),
    solution_text TEXT,
    answer_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. INGESTION LOGGING & MONITORING TABLES
-- ============================================================================

-- 3.1 INGESTION_RUNS (Theo dõi các đợt index tài liệu)
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    total_documents INT DEFAULT 0,
    total_chunks_created INT DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3.2 INGESTION_ERRORS (Ghi nhận lỗi chi tiết từng trang/chunk)
CREATE TABLE IF NOT EXISTS public.ingestion_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES public.ingestion_runs(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    page_number INT,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CHAT, PROGRESS & LEARNING ANALYTICS TABLES
-- ============================================================================

-- 4.1 CHAT_SESSIONS (Phiên hội thoại của học sinh)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Buổi ôn tập Toán 8',
    book_set TEXT NOT NULL DEFAULT 'KNTT',
    chapter INT,
    mode TEXT NOT NULL DEFAULT 'EXPLAIN' CHECK (mode IN ('EXPLAIN', 'SOLVE', 'HINT', 'PRACTICE', 'QUIZ', 'CHECK_ANSWER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 CHAT_MESSAGES (Tin nhắn trong phiên hội thoại)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    verification_result JSONB,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 LEARNING_PROGRESS (Tiến độ học tập và tỉ lệ đúng theo từng chủ đề)
CREATE TABLE IF NOT EXISTS public.learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    answered_count INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, topic_id, mode)
);

-- 4.4 STUDENT_MISTAKES (Lưu vết các lỗi sai của học sinh để gia sư nhắc nhở)
CREATE TABLE IF NOT EXISTS public.student_mistakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
    mistake_type TEXT NOT NULL, -- vd: 'sign_error' (nhầm dấu), 'formula_error' (nhớ sai hằng đẳng thức)
    context_snippet TEXT,
    correction_advice TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. BENCHMARK & EVALUATION TABLES
-- ============================================================================

-- 5.1 EVALUATION_CASES (Bộ test cases benchmark độ chính xác Toán 8)
CREATE TABLE IF NOT EXISTS public.evaluation_cases (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    expected_topic_id TEXT REFERENCES public.topics(id),
    expected_mode TEXT NOT NULL,
    ground_truth_answer TEXT NOT NULL,
    expected_citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 EVALUATION_RUNS (Kết quả kiểm thử tự động hệ thống AI)
CREATE TABLE IF NOT EXISTS public.evaluation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_at TIMESTAMPTZ DEFAULT NOW(),
    total_cases INT NOT NULL,
    passed_cases INT NOT NULL,
    accuracy_score FLOAT NOT NULL,
    metrics JSONB NOT NULL,
    model_name TEXT NOT NULL
);

-- ============================================================================
-- 6. INDEXES & HNSW VECTOR SEARCH INDEX
-- ============================================================================

-- Metadata Indexes
CREATE INDEX IF NOT EXISTS idx_chunks_meta ON public.knowledge_chunks (book_set, grade, approved, chapter, lesson, topic_id);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON public.knowledge_chunks (source_type);
CREATE INDEX IF NOT EXISTS idx_chunks_topic ON public.knowledge_chunks (topic_id);
CREATE INDEX IF NOT EXISTS idx_docs_meta ON public.knowledge_documents (source_type, book_set, grade, status);
CREATE INDEX IF NOT EXISTS idx_exercises_topic ON public.exercises (topic_id, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON public.chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON public.learning_progress (user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_user ON public.student_mistakes (user_id, topic_id);

-- HNSW Vector Index cho pgvector
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw
ON public.knowledge_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- 7. VECTOR SIMILARITY RPC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks (
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.4,
    match_count INT DEFAULT 10,
    filter_grade INT DEFAULT 8,
    filter_book_set TEXT DEFAULT NULL,
    filter_chapter INT DEFAULT NULL,
    filter_source_type TEXT DEFAULT NULL,
    filter_topic_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    source_type TEXT,
    grade INT,
    subject TEXT,
    book_set TEXT,
    volume INT,
    chapter INT,
    lesson INT,
    page INT,
    exercise_id TEXT,
    topic_id TEXT,
    content_type TEXT,
    content TEXT,
    has_visual BOOLEAN,
    image_path TEXT,
    approved BOOLEAN,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Cho phép backend gọi qua RPC an toàn
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.source_type,
        kc.grade,
        kc.subject,
        kc.book_set,
        kc.volume,
        kc.chapter,
        kc.lesson,
        kc.page,
        kc.exercise_id,
        kc.topic_id,
        kc.content_type,
        kc.content,
        kc.has_visual,
        kc.image_path,
        kc.approved,
        (1 - (kc.embedding <=> query_embedding))::FLOAT AS similarity
    FROM public.knowledge_chunks kc
    WHERE kc.approved = TRUE
      AND (filter_grade IS NULL OR kc.grade = filter_grade)
      AND (filter_book_set IS NULL OR kc.book_set = filter_book_set)
      AND (filter_chapter IS NULL OR kc.chapter = filter_chapter)
      AND (filter_source_type IS NULL OR kc.source_type = filter_source_type)
      AND (filter_topic_id IS NULL OR kc.topic_id = filter_topic_id)
      AND 1 - (kc.embedding <=> query_embedding) > match_threshold
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Kích hoạt RLS trên toàn bộ 13 bảng
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_runs ENABLE ROW LEVEL SECURITY;

-- 8.1 QUY TẮC BẢO VỆ RAW KNOWLEDGE TABLE:
-- Students / Public client KHÔNG ĐƯỢC đọc trực tiếp raw knowledge_chunks và knowledge_documents từ browser.
-- Chỉ service_role (Backend API layer) mới có toàn quyền SELECT / INSERT / UPDATE / DELETE.
DROP POLICY IF EXISTS "Deny Public Direct Read on Chunks" ON public.knowledge_chunks;
CREATE POLICY "Service Role Only on Chunks" ON public.knowledge_chunks
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Deny Public Direct Read on Docs" ON public.knowledge_documents;
CREATE POLICY "Service Role Only on Documents" ON public.knowledge_documents
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- 8.2 QUY TẮC BẢNG TOPICS: Mọi người có thể đọc danh mục chủ đề Toán 8
CREATE POLICY "Public Read Topics" ON public.topics
    FOR SELECT USING (TRUE);

-- 8.3 QUY TẮC BẢNG PROFILES: Người dùng chỉ xem/sửa hồ sơ của chính mình
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 8.4 QUY TẮC CHAT_SESSIONS & CHAT_MESSAGES: Người dùng chỉ truy cập phiên của chính mình
CREATE POLICY "Users access own sessions" ON public.chat_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own messages" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
        )
    );

-- 8.5 QUY TẮC LEARNING_PROGRESS & MISTAKES: Học sinh chỉ xem tiến độ của mình
CREATE POLICY "Users access own progress" ON public.learning_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own mistakes" ON public.student_mistakes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8.6 ADMIN ONLY ACCESS (Ingestion & Evaluation)
CREATE POLICY "Admin only on Ingestion Runs" ON public.ingestion_runs
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Admin only on Ingestion Errors" ON public.ingestion_errors
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Admin only on Evaluation" ON public.evaluation_runs
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Admin only on Evaluation Cases" ON public.evaluation_cases
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ============================================================================
-- 9. KHỞI TẠO DỮ LIỆU BAN ĐẦU CHO TOPICS TOÁN 8
-- ============================================================================

INSERT INTO public.topics (id, title, domain, chapter, description) VALUES
('don-thuc-da-thuc', 'Đơn thức và đa thức nhiều biến', 'ALGEBRA', 1, 'Nhận biết, thu gọn, bậc và các phép toán cộng trừ nhân chia đơn thức, đa thức.'),
('hang-dang-thuc', 'Hằng đẳng thức đáng nhớ', 'ALGEBRA', 2, '7 hằng đẳng thức đáng nhớ và các ứng dụng tính nhanh, rút gọn.'),
('phan-tich-da-thuc-thanh-nhan-tu', 'Phân tích đa thức thành nhân tử', 'ALGEBRA', 2, 'Phương pháp đặt nhân tử chung, dùng hằng đẳng thức, nhóm hạng tử và phối hợp.'),
('phan-thuc-dai-so', 'Phân thức đại số', 'ALGEBRA', 2, 'Khái niệm, điều kiện xác định, rút gọn, quy đồng và các phép tính phân thức.'),
('ham-so-bac-nhat', 'Hàm số bậc nhất y = ax + b', 'ALGEBRA', 5, 'Khái niệm hàm số, đồ thị hàm số bậc nhất, hệ số góc, đường thẳng song song và cắt nhau.'),
('phuong-trinh-bac-nhat', 'Phương trình bậc nhất một ẩn', 'ALGEBRA', 5, 'Khái niệm, cách giải và giải bài toán bằng cách lập phương trình.'),
('tu-giac', 'Tứ giác', 'GEOMETRY', 3, 'Khái niệm tứ giác và định lý tổng các góc trong một tứ giác bằng 360 độ.'),
('hinh-thang-can', 'Hình thang cân', 'GEOMETRY', 3, 'Định nghĩa, tính chất và dấu hiệu nhận biết hình thang cân.'),
('hinh-binh-hanh-chu-nhat-thoi-vuong', 'Hình bình hành, chữ nhật, thoi, vuông', 'GEOMETRY', 3, 'Định nghĩa, tính chất và các dấu hiệu nhận biết các tứ giác đặc biệt.'),
('dinh-ly-thales', 'Định lý Thales trong tam giác', 'GEOMETRY', 4, 'Đoạn thẳng tỉ lệ, định lý Thales thuận và đảo trong tam giác.'),
('tam-giac-dong-dang', 'Tam giác đồng dạng', 'GEOMETRY', 4, 'Khái niệm tam giác đồng dạng và 3 trường hợp đồng dạng (c-c-c, c-g-c, g-g).'),
('hinh-khoi-trong-thuc-tien', 'Hình chóp tam giác đều & tứ giác đều', 'GEOMETRY', 4, 'Hình chóp tam giác đều, hình chóp tứ giác đều, diện tích xung quanh và thể tích.'),
('thong-ke-va-xac-suat', 'Thu thập, biểu diễn dữ liệu và Xác suất', 'STATISTICS_PROBABILITY', 5, 'Biểu đồ hình quạt tròn, biểu đồ đoạn thẳng và xác suất thực nghiệm của biến cố.')
ON CONFLICT (id) DO NOTHING;
