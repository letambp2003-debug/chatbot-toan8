import assert from "assert";
import { RAG_CONFIG } from "../src/lib/rag/config.ts";
import { rerankKnowledgeChunks, executeHybridRAG } from "../src/lib/rag/retriever.ts";
import { BUILTIN_GRADE8_KNOWLEDGE, queryBuiltInKnowledge } from "../src/lib/rag/knowledge_store.ts";
import { runQueryRouter } from "../src/lib/scope/router.ts";
import { classifyQuestionFast } from "../src/lib/scope/scope_guard.ts";

console.log("============================================================================");
console.log("BẮT ĐẦU CHẠY BỘ KIỂM THỬ RAG RETRIEVER CHO TỪNG CHƯƠNG TOÁN 8 (PHASE 6)");
console.log("============================================================================");

// [Test 1] Kiểm tra Cấu hình Tập trung RAG_CONFIG
console.log("\n[Test 1] Kiểm tra Tập trung Cấu hình RAG_CONFIG (Không hard-code nhiều file)...");
assert.strictEqual(RAG_CONFIG.topKCandidates, 12, "topKCandidates phải là 12");
assert.strictEqual(RAG_CONFIG.finalK, 6, "finalK phải là 6");
assert.strictEqual(RAG_CONFIG.minScore, 0.60, "minScore phải là 0.60");
console.log("✔ [1.1] RAG_CONFIG đạt chuẩn: topKCandidates=12, finalK=6, minScore=0.60");

// [Test 2] Kiểm tra Retrieval cho 10 Chương Toán 8
const CHAPTER_TESTS = [
  { chapter: 1, name: "Đa thức", topic: "don-thuc-da-thuc", query: "Bậc của đơn thức thu gọn là gì" },
  { chapter: 2, name: "Hằng đẳng thức", topic: "hang-dang-thuc", query: "Phát biểu 7 hằng đẳng thức đáng nhớ" },
  { chapter: 3, name: "Tứ giác", topic: "tu-giac", query: "Tổng các góc trong một tứ giác bằng bao nhiêu độ" },
  { chapter: 4, name: "Định lý Thalès", topic: "dinh-ly-thales", query: "Định lý Thalès trong tam giác" },
  { chapter: 5, name: "Dữ liệu & Biểu đồ", topic: "thong-ke-va-xac-suat", query: "Biểu đồ hình quạt tròn dùng để làm gì" },
  { chapter: 6, name: "Phân thức đại số", topic: "phan-thuc-dai-so", query: "Quy tắc cộng hai phân thức đại số khác mẫu" },
  { chapter: 7, name: "Phương trình bậc nhất", topic: "phuong-trinh-bac-nhat", query: "Cách giải phương trình bậc nhất ax + b = 0" },
  { chapter: 8, name: "Xác suất biến cố", topic: "thong-ke-va-xac-suat", query: "Công thức tính xác suất của biến cố đồng khả năng" },
  { chapter: 9, name: "Tam giác đồng dạng", topic: "tam-giac-dong-dang", query: "3 trường hợp đồng dạng của hai tam giác" },
  { chapter: 10, name: "Hình khối thực tiễn", topic: "hinh-khoi-trong-thuc-tien", query: "Diện tích xung quanh hình chóp tam giác đều" },
];

console.log("\n[Test 2] Kiểm tra Retrieval tri thức cho từng chương (Chương 1 đến Chương 10)...");
for (const ct of CHAPTER_TESTS) {
  const scopeRes = classifyQuestionFast(ct.query);
  const routerRes = runQueryRouter(ct.query, "EXPLAIN", scopeRes);
  const matched = queryBuiltInKnowledge({ chapter: ct.chapter, topicId: ct.topic });

  assert.ok(matched.length > 0, `Chương ${ct.chapter} (${ct.name}) phải có ít nhất 1 chunk tri thức`);
  const topChunk = matched[0];
  assert.strictEqual(topChunk.chapter, ct.chapter, `Chunk trả về phải thuộc Chương ${ct.chapter}`);
  console.log(`✔ [Chương ${String(ct.chapter).padStart(2, "0")}] ${ct.name.padEnd(25)} -> Tìm thấy ${matched.length} chunks (Topic: ${topChunk.topic_id}, Page: ${topChunk.page}) [OK]`);
}

// [Test 3] Kiểm tra Exact Metadata Lookup FIRST (FIND_EXERCISE)
console.log("\n[Test 3] Kiểm tra Exact Metadata Match FIRST cho Bài tập SGK / SBT...");
const exactQueries = [
  { q: "Giải bài tập 1.5 trang 12 SBT Toán 8", expectedEx: "1.5", expectedPage: 12, expectedSource: "SBT" },
  { q: "Giải bài 2.14 trang 25 SBT Toán 8", expectedEx: "2.14", expectedPage: 25, expectedSource: "SBT" },
  { q: "Bài 4.2 trang 56 SBT Toán 8", expectedEx: "4.2", expectedPage: 56, expectedSource: "SBT" },
];

for (const eq of exactQueries) {
  const scopeRes = classifyQuestionFast(eq.q);
  const routerRes = runQueryRouter(eq.q, "SOLVE", scopeRes);

  const candidates = queryBuiltInKnowledge({
    exerciseNumber: routerRes.lookupMetadata?.exerciseNumber,
    pageNumber: routerRes.lookupMetadata?.pageNumber,
  });

  assert.ok(candidates.length > 0, `Phải tìm thấy bài tập ${eq.expectedEx}`);
  assert.strictEqual(candidates[0].exercise_id, eq.expectedEx, `Phải khớp chính xác exercise_id: ${eq.expectedEx}`);
  assert.strictEqual(candidates[0].page, eq.expectedPage, `Phải khớp chính xác page: ${eq.expectedPage}`);
  assert.strictEqual(candidates[0].source_type, eq.expectedSource, `Phải khớp đúng source_type: ${eq.expectedSource}`);
  console.log(`✔ [Exact Match] "${eq.q}" -> Khớp chính xác Bài ${eq.expectedEx} (Trang ${eq.expectedPage} ${eq.expectedSource}) [OK]`);
}

// [Test 4] Kiểm tra Intent-Driven Source Priority (EXPLAIN: SGK > SBT; SOLVE: SBT > SGK)
console.log("\n[Test 4] Kiểm tra Thứ tự ưu tiên Nguồn theo Intent (EXPLAIN vs SOLVE)...");
const mixedCandidates = BUILTIN_GRADE8_KNOWLEDGE.filter((c) => c.chapter === 2);

// EXPLAIN Mode -> SGK phải đứng đầu
const explainRerank = rerankKnowledgeChunks(mixedCandidates, ["SGK", "SBT", "KT_MD"], "hang-dang-thuc", undefined, undefined, 4);
assert.strictEqual(explainRerank.chunks[0].source_type, "SGK", "Chế độ EXPLAIN: SGK phải được xếp hạng cao nhất");
console.log(`✔ [4.1] Chế độ EXPLAIN: Nguồn ưu tiên hàng đầu là ${explainRerank.chunks[0].source_type} (Bài ${explainRerank.chunks[0].lesson}, Trang ${explainRerank.chunks[0].page})`);

// SOLVE Mode với Bài 2.14 -> SBT Bài 2.14 phải đứng đầu
const solveRerank = rerankKnowledgeChunks(mixedCandidates, ["SBT", "SGK", "KT_MD"], "hang-dang-thuc", "2.14", 25, 4);
assert.strictEqual(solveRerank.chunks[0].source_type, "SBT", "Chế độ SOLVE tra bài 2.14: SBT phải được xếp hạng cao nhất");
assert.strictEqual(solveRerank.chunks[0].exercise_id, "2.14", "Chế độ SOLVE: Bài 2.14 phải ở vị trí đầu");
console.log(`✔ [4.2] Chế độ SOLVE: Nguồn ưu tiên hàng đầu là ${solveRerank.chunks[0].source_type} (Bài tập ${solveRerank.chunks[0].exercise_id})`);

// [Test 5] Kiểm tra Nhận diện Ngữ cảnh Đa phương thức (Visual Page / Hình vẽ)
console.log("\n[Test 5] Kiểm tra Nhận diện Đa phương thức (Visual Content Detection)...");
const visualChunks = BUILTIN_GRADE8_KNOWLEDGE.filter((c) => c.has_visual);
assert.ok(visualChunks.length >= 5, "Kho tri thức phải có các chunk đánh dấu has_visual");

const visualScope = classifyQuestionFast("Cho tam giác ABC có DE song song BC, tính đoạn thẳng");
const visualRouter = runQueryRouter("Cho tam giác ABC có DE song song BC", "SOLVE", visualScope);

executeHybridRAG({
  question: "Cho hình thang ABCD, hãy tính góc C và D",
  bookSet: "KNTT",
  chapter: "3",
  topicId: "tu-giac",
  routerResult: visualRouter,
}).then((res) => {
  assert.strictEqual(res.hasVisualContent, true, "Câu hỏi hình thang phải được gắn cờ hasVisualContent = true");
  assert.ok(res.chunks.length <= RAG_CONFIG.finalK, `Số lượng chunks sau rerank không được vượt quá finalK (${RAG_CONFIG.finalK})`);
  assert.ok(res.chunks.length >= 1, "Phải trả về ít nhất 1 chunk hợp lệ");
  console.log(`✔ [5.1] Nhận diện Visual: hasVisualContent=${res.hasVisualContent}, Chunks trả về=${res.chunks.length} chunks`);

  console.log("\n============================================================================");
  console.log("🎉 TẤT CẢ CÁC BÀI KIỂM THỬ RAG RETRIEVER & CHAPTERS PHASE 6 ĐẠT 100%!");
  console.log("============================================================================");
}).catch((err) => {
  console.error("Lỗi Test RAG:", err);
  process.exit(1);
});
