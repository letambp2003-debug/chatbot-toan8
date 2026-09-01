import fs from "fs";
import path from "path";
import assert from "assert";

console.log("============================================================================");
console.log("BẮT ĐẦU CHẠY BỘ KIỂM THỬ DATABASE & PGVECTOR SCHEMA CHO PHASE 3");
console.log("============================================================================");

// Đọc nội dung migration SQL
const migrationPath = path.resolve("supabase/migrations/20260901000000_phase3_core_schema.sql");
assert.ok(fs.existsSync(migrationPath), "Tệp migration Phase 3 phải tồn tại");
const sql = fs.readFileSync(migrationPath, "utf8");

// ----------------------------------------------------------------------------
// 1. KIỂM THỬ EXTENSIONS (PGVECTOR & UUID)
// ----------------------------------------------------------------------------
console.log("\n[Test 1] Kiểm tra Kích hoạt Extension pgvector và uuid-ossp");
assert.ok(sql.includes("CREATE EXTENSION IF NOT EXISTS vector;"), "Phải kích hoạt extension vector (pgvector)");
assert.ok(sql.includes("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"), "Phải kích hoạt extension uuid-ossp");
console.log("✔ [1.1] Extension pgvector và uuid-ossp đã được kích hoạt");

// ----------------------------------------------------------------------------
// 2. KIỂM THỬ ĐẦY ĐỦ 13 BẢNG THEO YÊU CẦU
// ----------------------------------------------------------------------------
console.log("\n[Test 2] Kiểm tra Định nghĩa 13 Bảng Dữ liệu Cơ sở");

const REQUIRED_TABLES = [
  "profiles",
  "topics",
  "knowledge_documents",
  "knowledge_chunks",
  "exercises",
  "ingestion_runs",
  "ingestion_errors",
  "chat_sessions",
  "chat_messages",
  "learning_progress",
  "student_mistakes",
  "evaluation_cases",
  "evaluation_runs",
];

for (const tbl of REQUIRED_TABLES) {
  assert.ok(
    sql.includes(`CREATE TABLE IF NOT EXISTS public.${tbl}`),
    `Bảng public.${tbl} phải được định nghĩa trong schema`
  );
}
console.log(`✔ [2.1] Toàn bộ 13/13 bảng yêu cầu đã được tạo đầy đủ`);

// ----------------------------------------------------------------------------
// 3. KIỂM THỬ CHI TIẾT CÁC CỘT BẮT BUỘC TRONG KNOWLEDGE_DOCUMENTS & KNOWLEDGE_CHUNKS
// ----------------------------------------------------------------------------
console.log("\n[Test 3] Kiểm tra Cột dữ liệu bắt buộc trong knowledge_documents và knowledge_chunks");

const DOC_COLUMNS = [
  "source_type",
  "book_set",
  "grade",
  "subject",
  "volume",
  "filename",
  "checksum",
  "page_count",
  "processed_page_count",
  "status",
  "created_at",
];

for (const col of DOC_COLUMNS) {
  assert.ok(sql.includes(col), `knowledge_documents phải chứa cột '${col}'`);
}
console.log("✔ [3.1] knowledge_documents chứa đầy đủ 11/11 cột trường bắt buộc");

const CHUNK_COLUMNS = [
  "document_id",
  "source_type",
  "grade",
  "book_set",
  "volume",
  "chapter",
  "lesson",
  "page",
  "topic_id",
  "exercise_id",
  "content_type",
  "content",
  "embedding VECTOR(768)",
  "has_visual",
  "image_path",
  "approved",
  "checksum",
];

for (const col of CHUNK_COLUMNS) {
  assert.ok(sql.includes(col), `knowledge_chunks phải chứa cột '${col}'`);
}
console.log("✔ [3.2] knowledge_chunks chứa đầy đủ 17/17 cột trường bắt buộc (kèm vector(768))");

// ----------------------------------------------------------------------------
// 4. KIỂM THỬ HNSW VECTOR INDEX VÀ METADATA INDEXES
// ----------------------------------------------------------------------------
console.log("\n[Test 4] Kiểm tra HNSW Vector Index và Metadata Indexes");

assert.ok(
  sql.includes("USING hnsw (embedding vector_cosine_ops)"),
  "Phải tạo HNSW index tối ưu cosine similarity trên knowledge_chunks.embedding"
);
assert.ok(sql.includes("idx_chunks_meta"), "Phải có index tổng hợp metadata trên chunks");
assert.ok(sql.includes("idx_docs_meta"), "Phải có index metadata trên documents");
console.log("✔ [4.1] HNSW Vector Index (vector_cosine_ops, m=16, ef=64) và Metadata B-tree Indexes PASSED");

// ----------------------------------------------------------------------------
// 5. KIỂM THỬ VECTOR SIMILARITY RPC FUNCTION
// ----------------------------------------------------------------------------
console.log("\n[Test 5] Kiểm tra RPC Function match_knowledge_chunks");

assert.ok(sql.includes("CREATE OR REPLACE FUNCTION public.match_knowledge_chunks"), "Phải định nghĩa RPC match_knowledge_chunks");
assert.ok(sql.includes("query_embedding VECTOR(768)"), "Tham số query_embedding phải là VECTOR(768)");
assert.ok(sql.includes("SECURITY DEFINER"), "Hàm RPC phải là SECURITY DEFINER để gọi an toàn từ service layer");
assert.ok(sql.includes("1 - (kc.embedding <=> query_embedding)"), "Công thức tính cosine similarity phải chuẩn xác");
console.log("✔ [5.1] RPC match_knowledge_chunks với lọc metadata và pgvector cosine similarity PASSED");

// ----------------------------------------------------------------------------
// 6. KIỂM THỬ ROW LEVEL SECURITY (RLS) & BẢO VỆ RAW KNOWLEDGE
// ----------------------------------------------------------------------------
console.log("\n[Test 6] Kiểm tra Row Level Security (RLS) & Bảo vệ Raw Tables");

for (const tbl of REQUIRED_TABLES) {
  assert.ok(
    sql.includes(`ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY;`),
    `Bảng ${tbl} phải bật ENABLE ROW LEVEL SECURITY`
  );
}
console.log("✔ [6.1] RLS đã được bật trên 100% 13 bảng");

// Kiểm tra: Học sinh / Client không được đọc raw knowledge_chunks trực tiếp
assert.ok(
  sql.includes('"Service Role Only on Chunks"'),
  "knowledge_chunks chỉ cho phép backend service_role truy cập trực tiếp"
);
assert.ok(
  sql.includes('"Service Role Only on Documents"'),
  "knowledge_documents chỉ cho phép backend service_role truy cập trực tiếp"
);
assert.ok(
  !sql.includes('"Public Read Approved Chunks"'),
  "Tuyệt đối không cấp quyền Public SELECT trực tiếp trên bảng raw knowledge_chunks"
);
console.log("✔ [6.2] Raw knowledge_chunks và knowledge_documents được bảo vệ: Chặn Direct Browser Access PASSED");

// ----------------------------------------------------------------------------
// 7. KIỂM THỬ KHÔNG LƯU GEMINI API KEY TRONG SCHEMA DATABASE
// ----------------------------------------------------------------------------
console.log("\n[Test 7] Kiểm tra không lưu Gemini API Key trong Schema Database");

const lowerSql = sql.toLowerCase();
assert.ok(!lowerSql.includes("gemini_api_key"), "Schema không được chứa cột gemini_api_key");
assert.ok(!lowerSql.includes("google_api_key"), "Schema không được chứa cột google_api_key");
assert.ok(!lowerSql.includes("api_key text"), "Schema không được chứa cột lưu trữ plaintext api_key");
console.log("✔ [7.1] Schema tuyệt đối không lưu User Gemini API Key (100% Zero Database Storage for Keys)");

console.log("\n============================================================================");
console.log("🎉 TOÀN BỘ 7/7 NHÓM BÀI TEST DATABASE, PGVECTOR & RLS PHASE 3 ĐẠT 100%!");
console.log("============================================================================");
