import assert from "assert";
import { runFullKnowledgeIngestion } from "../src/lib/ingestion/pipeline.ts";
import { BUILTIN_GRADE8_KNOWLEDGE } from "../src/lib/rag/knowledge_store.ts";
import { classifyQuestionFast } from "../src/lib/scope/scope_guard.ts";
import { runQueryRouter } from "../src/lib/scope/router.ts";
import { executeHybridRAG } from "../src/lib/rag/retriever.ts";
import { buildMathContext } from "../src/lib/rag/context_builder.ts";
import { runDeterministicVerifier } from "../src/lib/verifier/answer_verifier.ts";
import { encryptApiKey, decryptApiKey } from "../src/lib/security/encryption.ts";

console.log("============================================================================");
console.log("BẮT ĐẦU CHẠY BỘ RELEASE GATE VÀ USER JOURNEY END-TO-END (PHASE 9)");
console.log("============================================================================");

// [CỔNG 1] KIỂM ĐỊNH READY GATE & COVERAGE REPORT
console.log("\n[Cổng 1] Kiểm tra Coverage 100% & Ingestion Status...");
const ingestionResult = await runFullKnowledgeIngestion();
const coverage = ingestionResult.coverage;

assert.strictEqual(coverage.status, "READY", "Status phải là READY");
assert.strictEqual(coverage.document_pages, 525, "Tổng số trang phải là 525 trang");
assert.strictEqual(coverage.processed_pages, 525, "Đã xử lý 100% số trang");
assert.strictEqual(coverage.unmapped_chunks, 0, "Unmapped knowledge phải bằng 0");
assert.strictEqual(coverage.unmapped_exercises, 0, "Unmapped exercises phải bằng 0");
assert.strictEqual(coverage.failed_pages, 0, "Failed pages phải bằng 0");
console.log(`✔ [1.1] Ingestion Gate: READY (${coverage.document_pages} pages, ${coverage.chunks} chunks, ${coverage.exercises} exercises, 0 failed, 0 unmapped) [PASSED]`);

// [CỔNG 2] KIỂM ĐỊNH BẢO MẬT & ZERO LEAK
console.log("\n[Cổng 2] Kiểm tra Bảo mật Phiên & Mã hóa AES-256-GCM...");
const testKey = "AIzaSyDUMMYKEYFORPRODRELEASEGATEVALIDATION12345";
const encryptedKey = encryptApiKey(testKey);
assert.ok(encryptedKey.length > 50);
const decryptedKey = decryptApiKey(encryptedKey);
assert.strictEqual(decryptedKey?.key, testKey);
console.log("✔ [2.1] Security & BYOK Encryption Gate: [PASSED]");

// [CỔNG 3] KIỂM ĐỊNH TRÍCH DẪN NGUỒN (CITATION INTEGRITY)
console.log("\n[Cổng 3] Kiểm tra Toàn vẹn Trích dẫn Nguồn SGK/SBT...");
for (const chunk of BUILTIN_GRADE8_KNOWLEDGE) {
  assert.ok(chunk.source_type, "Chunk phải có source_type");
  assert.ok(chunk.volume, "Chunk phải có volume");
  assert.ok(chunk.chapter, "Chunk phải có chapter");
  assert.ok(chunk.page, "Chunk phải có page");
}
console.log(`✔ [3.1] Citation Gate: 100% Chunks (${BUILTIN_GRADE8_KNOWLEDGE.length}/${BUILTIN_GRADE8_KNOWLEDGE.length}) có đầy đủ metadata chuẩn [PASSED]`);

// [CỔNG 4] MÔ PHỎNG END-TO-END USER JOURNEY HOÀN CHỈNH
console.log("\n[Cổng 4] Thực thi Toàn bộ End-to-End User Journey...");
const BASE_URL = "http://localhost:3000";

async function runE2EJourney() {
  // Bước 1: Khách truy cập trang đăng ký & đăng nhập
  console.log("  → [Bước 1] Học sinh truy cập /register và /login...");
  const loginRes = await fetch(`${BASE_URL}/login`);
  assert.strictEqual(loginRes.status, 200);

  // Bước 2: Học sinh kết nối Google AI Key
  console.log("  → [Bước 2] Học sinh kết nối API Key qua BYOK validation...");
  const validateRes = await fetch(`${BASE_URL}/api/key/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: testKey }),
  });
  const validateData = await validateRes.json();
  assert.strictEqual(validateData.valid, true, "Key validation mock phải trả về true");

  // Bước 3: Học sinh đặt câu hỏi Toán 8
  const question = "Hãy hướng dẫn em giải bài 2.14 trang 25 SBT Toán 8 tập 1";
  console.log(`  → [Bước 3] Học sinh hỏi câu: "${question}"...`);

  // Bước 4: Scope Guard & Query Router
  const scope = classifyQuestionFast(question);
  assert.strictEqual(scope.decision, "IN_SCOPE");
  assert.strictEqual(scope.intent, "FIND_EXERCISE");

  const router = runQueryRouter(question, "SOLVE", scope);
  assert.strictEqual(router.lookupMetadata?.exerciseNumber, "2.14");

  // Bước 5: Hybrid RAG Retrieval (Exact Match First)
  const rag = await executeHybridRAG({
    question,
    bookSet: "KNTT",
    chapter: "2",
    topicId: scope.topic_id || undefined,
    routerResult: router,
  });
  assert.ok(rag.chunks.length > 0);
  assert.strictEqual(rag.chunks[0].exercise_id, "2.14");

  // Bước 6: Ghép nối Runtime Prompt
  const context = buildMathContext({
    question,
    mode: "SOLVE",
    bookSet: "KNTT",
    chapter: "2",
    scopeResult: scope,
    routerResult: router,
    chunks: rag.chunks,
  });
  assert.ok(context.systemInstruction.includes("HARD SYSTEM RULES (Nguồn: kt.md)"));

  // Bước 7: Mô phỏng Lời giải & Answer Verifier
  const mockSolution = `
### Kiến thức cần nhớ:
Hằng đẳng thức: \\( (A + B)^2 = A^2 + 2AB + B^2 \\), \\( (A - B)^2 = A^2 - 2AB + B^2 \\), \\( (A - B)(A + B) = A^2 - B^2 \\).

### Phân tích:
Áp dụng trực tiếp các hằng đẳng thức đáng nhớ số 1, 2 và 3.

### Lời giải chi tiết:
a) \\( (2x + 3y)^2 = (2x)^2 + 2(2x)(3y) + (3y)^2 = 4x^2 + 12xy + 9y^2 \\).
b) \\( (3x - 1)^2 = (3x)^2 - 2(3x)(1) + 1^2 = 9x^2 - 6x + 1 \\).
c) \\( (x - 2y)(x + 2y) = x^2 - (2y)^2 = x^2 - 4y^2 \\).

### Kết luận:
Đã hoàn thành khai triển 3 biểu thức đúng quy tắc.
`;
  const verif = runDeterministicVerifier(mockSolution, question, rag.chunks);
  assert.strictEqual(verif.needs_regeneration, false);
  assert.strictEqual(verif.calculation_ok, true);

  // Bước 8: Lưu tiến độ học tập (Progress)
  console.log("  → [Bước 8] Cập nhật tiến độ học tập vào hệ thống...");
  const progRes = await fetch(`${BASE_URL}/api/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic_id: "hang-dang-thuc",
      question,
      result: "Hoàn thành bài 2.14 SBT",
      is_correct: true,
      mistakes: [],
      difficulty: "medium",
    }),
  });
  assert.strictEqual(progRes.status, 200);

  // Bước 9: Logout & Xóa session key an toàn
  console.log("  → [Bước 9] Học sinh đăng xuất & xóa session AI key...");
  const deleteKeyRes = await fetch(`${BASE_URL}/api/key`, { method: "DELETE" });
  assert.strictEqual(deleteKeyRes.status, 200);

  console.log("\n============================================================================");
  console.log("🎉 TOÀN BỘ END-TO-END USER JOURNEY & RELEASE GATE ĐẠT 100% TIÊU CHUẨN!");
  console.log("============================================================================");
}

runE2EJourney().catch((err) => {
  console.error("Lỗi Release Gate E2E:", err);
  process.exit(1);
});
