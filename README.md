# Gia sư AI Toán 8 — Production Web Application

Hệ thống Web Application **"Gia sư AI Toán 8"** được xây dựng chuẩn Enterprise theo kiến trúc Next.js 14, Supabase (PostgreSQL + pgvector), Google GenAI SDK (`@google/genai`), Hybrid RAG Engine và Multi-Stage Verification Pipeline.

---

## 🌟 Tính Năng Nổi Bật

### 1. BYOK (Bring Your Own Key) Security Architecture
- Người dùng sử dụng chính Google AI API Key cá nhân để khởi tạo phiên học tập.
- **Bảo mật tuyệt đối**:
  - Không lưu key vào `localStorage` hay `sessionStorage`.
  - Không xuất hiện trong Client JavaScript, HTML hay Server application logs.
  - Mã hóa chuẩn **AES-256-GCM** với IV ngẫu nhiên 12-byte và Auth Tag 16-byte, lưu trong **HttpOnly, Secure, SameSite=Strict cookie** có thời hạn sống 8 giờ (TTL).
  - Rate limiting (tối đa 10 request/phút) và Request Origin Guard chống CSRF.

### 2. Hybrid RAG Retrieval Engine & Kho Tri Thức 10 Chương Toán 8
- **Tập trung cấu hình RAG**: Quản trị tập trung tại `src/lib/rag/config.ts` (`topKCandidates = 12`, `finalK = 6`, `minScore = 0.60`).
- **Quy trình tìm kiếm đa tầng**:
  1. **Exact Metadata Match FIRST**: Tự động nhận diện số bài tập (`exercise_id`), số trang, chương trong SGK/SBT để ưu tiên tìm kiếm chính xác trước.
  2. **Vector Similarity Search**: Tìm kiếm vector tương đồng ngữ nghĩa qua hàm RPC `match_knowledge_chunks` trên PostgreSQL `pgvector` với vector 768 chiều từ model `gemini-embedding-001`.
  3. **Intent Priority**:
     - `EXPLAIN`: SGK > SBT > KT_MD
     - `SOLVE` & `PRACTICE`: SBT + SGK > KT_MD
  4. **Nhận diện Ngữ cảnh Đa phương thức (Visual Context)**: Tự động phát hiện bài có hình vẽ / biểu đồ (`has_visual = true`) để gửi kèm ảnh trang mà không nhồi toàn bộ PDF.

### 3. Strict Solver, Structured Verifier & Self-Correction Loop
- **Runtime Prompt Assembly**: Ghép nối 5 thành phần:
  - `knowledge/kt.md` (Hard System Rules)
  - `knowledge/tc.md` (Personality & Pedagogy ONLY - tuyệt đối không coi là nguồn tri thức)
  - `Student Context` (Bộ sách, chương, bài, chế độ học)
  - `Retrieved Knowledge` (Best 4–6 chunks từ SGK/SBT)
  - `Question` (Câu hỏi & ảnh đính kèm của học sinh)
- **Structured Verifier**: Kiểm định 9 tiêu chuẩn chất lượng (scope_ok, source_supported, calculation_ok, formula_ok, logic_ok, grade8_method, citation_ok, needs_regeneration, issues).
- **Deterministic Math Verification**: Tự động kiểm tra nghiệm đại số ($ax + b = c$), công thức hằng đẳng thức và định lý hình học.
- **Self-Correction Loop**: Tự động tái tạo kèm feedback tối đa **2 lần**. Nếu vẫn không đạt, trả về **Safe Fallback** an toàn thay vì xuất lời giải lỗi.

### 4. 6 Chế độ Học tập & Structured Answer Card
- **6 Chế độ**: Hỏi bài (`EXPLAIN`), Giải bài (`SOLVE`), Gợi ý (`HINT`), Luyện tập (`PRACTICE`), Trắc nghiệm (`QUIZ`), Kiểm tra đáp án (`CHECK_ANSWER`).
- **Answer Card 5 Khối**:
  - 💡 Kiến thức cần nhớ
  - 🔍 Phân tích & Cách làm
  - ✍️ Lời giải chi tiết (LaTeX `\( ... \)` và `\[ ... \]`)
  - 🎯 Kết luận
  - ⚠️ Lỗi thường gặp
  - 📚 Nguồn tham khảo SGK/SBT (Safe Snippets - Không công khai raw PDF)

### 5. Progress & Mistake Analytics Dashboard
- Theo dõi năng lực học sinh theo từng chủ đề Toán 8.
- Phân tích các dạng lỗi thường gặp kèm lời khuyên sửa lỗi.
- Đề xuất bài học tiếp theo (Smart Next Lesson Recommendation).
- Admin QA Dashboard tại `/admin` theo dõi toàn bộ Release Gate và Ingestion metrics.

---

## 🏗️ Cấu Trúc Thư Mục

```
├── knowledge/               # Tệp quy tắc vận hành (kt.md, tc.md) và tài liệu SGK/SBT
├── src/
│   ├── app/                 # Next.js 14 App Router (Auth, Admin, API Routes, Chat UI)
│   ├── components/          # React Components (AnswerCard, ChatArea, Sidebar, Topbar, ProgressModal,...)
│   ├── lib/
│   │   ├── gemini/          # Google GenAI SDK client, config, solver
│   │   ├── ingestion/       # Pipeline trích xuất PDF SGK/SBT, checksum, topic mapping, coverage
│   │   ├── knowledge/       # Khung chương trình 10 chương Toán 8
│   │   ├── pipeline/        # 8-Stage Strict Execution Pipeline
│   │   ├── rag/             # Config, knowledge store, retriever, context builder
│   │   ├── scope/           # Scope guard (8 categories), query router, anti-injection
│   │   ├── security/        # AES-256-GCM encryption, rate limiter, origin guard, logger, env validation
│   │   ├── supabase/        # Client, server, admin Supabase configuration
│   │   └── verifier/        # Structured verifier & deterministic algebraic check
│   └── types/               # TypeScript declarations (chat, knowledge, session)
├── supabase/
│   └── migrations/          # 13 bảng schema, pgvector extension, RPC match_knowledge_chunks, RLS policies
└── test/                    # 12 bộ test suites hồi quy tự động (Phases 1 - 9)
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình biến môi trường
Tạo tệp `.env.local` từ mẫu `.env.example`:
```bash
cp .env.example .env.local
```
Cấu hình các khóa bắt buộc:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
KEY_ENCRYPTION_SECRET=your-32-byte-hex-or-base64-secret-for-aes256gcm
GEMINI_ADMIN_API_KEY=your-gemini-admin-api-key-for-ingestion
```

### 3. Chạy môi trường phát triển (Development)
```bash
npm run dev
```
Truy cập ứng dụng tại `http://localhost:3000`.

### 4. Build Production
```bash
npm run build
npm run start
```

---

## 🧪 Bộ Kiểm Thử Tự Động (Automated Test Suites)

Hệ thống bao gồm 12 bộ test suites bao phủ toàn bộ các pha:
```bash
# Chạy toàn bộ 12 test suites
node test/phase1_unit_tests.mjs
node test/phase2_security_tests.mjs
node test/phase3_database_tests.mjs
node test/phase4_ingestion_tests.mjs
node test/phase5_scope_benchmark_tests.mjs
node test/phase6_rag_chapter_tests.mjs
node test/phase7_solver_verifier_tests.mjs
node test/phase8_chat_ui_progress_tests.mjs
node test/phase8_browser_ui_tests.mjs
node test/phase9_evaluation_suite.mjs
node test/phase9_secret_leak_audit.mjs
node test/phase9_release_gate_e2e.mjs
```

---

## 📄 Bản Quyền & Giấy Phép
Dự án được xây dựng và tối ưu hoá phục vụ việc ôn tập và củng cố kiến thức môn Toán lớp 8 cho học sinh Việt Nam.
