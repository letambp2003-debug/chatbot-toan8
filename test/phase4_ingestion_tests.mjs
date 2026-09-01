import assert from "assert";
import { runFullKnowledgeIngestion } from "../src/lib/ingestion/pipeline.ts";

console.log("============================================================================");
console.log("BẮT ĐẦU CHẠY BỘ KIỂM THỬ INGESTION PIPELINE & COVERAGE CHECKER (PHASE 4)");
console.log("============================================================================");

async function runTests() {
  console.log("\n[Test 1] Khởi chạy Ingestion Pipeline thật trên toàn bộ SGK / SBT / Rules (Không mock)...");
  const result = await runFullKnowledgeIngestion();

  // 1. Kiểm tra tài liệu & Số trang
  assert.ok(result.documents.length >= 5, "Phải ingest đủ 5 tệp: SGK 1, SGK 2, SBT 1, SBT 2 và kt.md");
  assert.strictEqual(result.coverage.document_pages, 525, "Tổng số trang phải là 525 trang (126 + 142 + 114 + 142 + 1)");
  assert.strictEqual(result.coverage.processed_pages, 525, "Đã xử lý 100% số trang");
  console.log(`✔ [1.1] Ingestion hoàn tất: 5 tệp, 525 trang xử lý trong ${result.durationMs}ms`);

  // 2. Kiểm tra Checksum & Tính toàn vẹn
  for (const doc of result.documents) {
    assert.ok(doc.checksum && doc.checksum.length === 64, `Tài liệu ${doc.filename} phải có SHA-256 checksum hợp lệ`);
  }
  console.log("✔ [2.1] SHA-256 Checksum được sinh đầy đủ cho tất cả tài liệu");

  // 3. Kiểm tra Chunks & Topic Mapping
  assert.ok(result.chunks.length > 500, "Tổng số chunks phải lớn hơn 500");
  assert.strictEqual(result.coverage.unmapped_chunks, 0, "Không được có chunk nào bị unmapped (unmapped_chunks = 0)");
  assert.strictEqual(result.coverage.duplicate_chunks, 0, "Không được có chunk trùng lặp ID");
  console.log(`✔ [3.1] Đã tạo ${result.chunks.length} chunks: 100% đã map vào Topic Toán 8 chuẩn`);

  // 4. Kiểm tra Kho Bài tập SBT & SGK
  assert.ok(result.coverage.exercises > 0, "Phải trích xuất được các bài tập từ SBT");
  assert.strictEqual(result.coverage.unmapped_exercises, 0, "Không được có bài tập nào chưa map chủ đề");
  console.log(`✔ [4.1] Đã trích xuất và map ${result.coverage.mapped_exercises}/${result.coverage.exercises} bài tập vào Topic Toán 8`);

  // 5. Kiểm tra Cách ly Quy tắc & tc.md
  const tcChunks = result.chunks.filter((c) => c.document_id?.includes("tc") || c.content?.includes("TC.MD"));
  assert.strictEqual(tcChunks.length, 0, "tc.md TUYỆT ĐỐI KHÔNG ĐƯỢC ingest vào vector knowledge search");
  const ktChunks = result.chunks.filter((c) => c.source_type === "KT_MD");
  assert.ok(ktChunks.length > 0, "kt.md phải được ingest làm RULES");
  console.log("✔ [5.1] Bảo mật & Kiến trúc: tc.md được cách ly hoàn toàn, kt.md được ingest làm RULES");

  // 6. Kiểm tra Tiêu chuẩn Ready Gate
  assert.strictEqual(result.coverage.failed_pages, 0, "failed_pages phải bằng 0");
  assert.strictEqual(result.coverage.gate_checks.no_failed_pages, true);
  assert.strictEqual(result.coverage.gate_checks.no_unmapped_chunks, true);
  assert.strictEqual(result.coverage.gate_checks.no_unmapped_exercises, true);
  assert.strictEqual(result.coverage.status, "READY", "Trạng thái hệ thống phải là READY");
  console.log("✔ [6.1] Ready Gate Passed: Toàn bộ điều kiện READY đạt 100%");

  console.log("\n============================================================================");
  console.log("🎉 TẤT CẢ CÁC BÀI KIỂM THỬ INGESTION & COVERAGE PHASE 4 ĐỀU ĐẠT 100%!");
  console.log("============================================================================");
}

runTests().catch((err) => {
  console.error("Lỗi khi chạy Ingestion Tests:", err);
  process.exit(1);
});
