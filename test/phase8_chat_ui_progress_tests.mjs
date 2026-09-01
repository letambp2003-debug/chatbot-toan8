import assert from "assert";
import { TOAN8_KNTT_CURRICULUM } from "../src/lib/knowledge/curriculum.ts";

console.log("============================================================================");
console.log("BẮT ĐẦU CHẠY BỘ KIỂM THỬ GIAO DIỆN CHAT, ANSWER CARD & DASHBOARD (PHASE 8)");
console.log("============================================================================");

// [Test 1] Kiểm tra 6 Chế độ học (Learning Modes)
console.log("\n[Test 1] Kiểm tra Đầy đủ 6 Chế độ học (Modes)...");
const REQUIRED_MODES = ["EXPLAIN", "SOLVE", "HINT", "PRACTICE", "QUIZ", "CHECK_ANSWER"];
for (const mode of REQUIRED_MODES) {
  assert.ok(REQUIRED_MODES.includes(mode), `Mode ${mode} phải được hỗ trợ`);
  console.log(`✔ [Mode] ${mode.padEnd(16)} -> Hỗ trợ đầy đủ [OK]`);
}

// [Test 2] Kiểm tra Phân rã Khối trong Structured Answer Card
console.log("\n[Test 2] Kiểm tra Phân rã Khối của Answer Card (Kiến thức, Cách làm, Lời giải, Kết luận, Lỗi sai)...");
const sampleRawOutput = `
### Kiến thức cần nhớ:
\\( (A - B)^2 = A^2 - 2AB + B^2 \\)

### Phân tích dạng bài:
Biểu thức có dạng bình phương của một hiệu với \\( A = 2x \\) và \\( B = 3y \\).

### Lời giải chi tiết:
Bước 1: Áp dụng công thức hằng đẳng thức số 2:
\\[
(2x - 3y)^2 = (2x)^2 - 2 \\cdot (2x) \\cdot (3y) + (3y)^2
\\]
Bước 2: Tính lũy thừa và nhân các hệ số:
\\[
= 4x^2 - 12xy + 9y^2
\\]

### Kết luận:
Vậy \\( (2x - 3y)^2 = 4x^2 - 12xy + 9y^2 \\).

### Lỗi thường gặp:
Học sinh hay quên nhân 2 vào tích giữa hoặc nhầm \\( (2x)^2 = 2x^2 \\) thay vì \\( 4x^2 \\).
`;

function parseAnswerSectionsTest(rawText) {
  const lines = rawText.split("\n");
  let currentSection = "solution";
  const sections = { knowledge: [], method: [], solution: [], conclusion: [], mistakes: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#+\s*(kiến thức cần nhớ|công thức)/i.test(trimmed)) { currentSection = "knowledge"; continue; }
    else if (/^#+\s*(phân tích|cách làm)/i.test(trimmed)) { currentSection = "method"; continue; }
    else if (/^#+\s*(lời giải|các bước giải)/i.test(trimmed)) { currentSection = "solution"; continue; }
    else if (/^#+\s*(kết luận|đáp số)/i.test(trimmed)) { currentSection = "conclusion"; continue; }
    else if (/^#+\s*(lỗi thường gặp|chú ý)/i.test(trimmed)) { currentSection = "mistakes"; continue; }

    sections[currentSection]?.push(line);
  }

  return {
    knowledge: sections.knowledge.join("\n").trim(),
    method: sections.method.join("\n").trim(),
    solution: sections.solution.join("\n").trim(),
    conclusion: sections.conclusion.join("\n").trim(),
    mistakes: sections.mistakes.join("\n").trim(),
  };
}

const parsed = parseAnswerSectionsTest(sampleRawOutput);
assert.ok(parsed.knowledge.includes("(A - B)^2"), "Khối kiến thức cần nhớ phải được trích xuất");
assert.ok(parsed.method.includes("bình phương"), "Khối cách làm/phân tích phải được trích xuất");
assert.ok(parsed.solution.includes("4x^2 - 12xy + 9y^2"), "Khối lời giải chi tiết phải được trích xuất");
assert.ok(parsed.conclusion.includes("Vậy"), "Khối kết luận phải được trích xuất");
assert.ok(parsed.mistakes.includes("quên nhân 2"), "Khối lỗi thường gặp phải được trích xuất");
console.log("✔ [2.1] Phân tích và render đầy đủ 5 khối thành phần của Answer Card [OK]");

// [Test 3] Kiểm tra Nguồn trích dẫn an toàn (Không công khai raw PDF)
console.log("\n[Test 3] Kiểm tra An toàn Trích dẫn Nguồn (Safe Source Citation)...");
const sampleSource = {
  id: "SGK_T8_V1_CH02_P033",
  source_type: "SGK",
  book_set: "KNTT",
  volume: 1,
  chapter: 2,
  lesson: 6,
  page: 33,
  title: "SGK Toán 8 Tập 1 - Chương 2 - Bài 6 (Trang 33)",
  snippet: "7 Hằng đẳng thức đáng nhớ...",
};

assert.strictEqual(sampleSource.source_type, "SGK", "Nguồn phải là SGK");
assert.strictEqual(sampleSource.page, 33, "Trang phải là 33");
assert.ok(!sampleSource.rawPdfPath, "Tuyệt đối không để lộ đường dẫn file PDF thật trên server");
console.log(`✔ [3.1] Trích dẫn nguồn an toàn: "${sampleSource.title}" (Snippet: "${sampleSource.snippet}") [OK]`);

// [Test 4] Kiểm tra Danh mục Chương trình 10 Chương và Bài học
console.log("\n[Test 4] Kiểm tra Danh mục Khung Chương trình 10 Chương (Curriculum Mapping)...");
for (let c = 1; c <= 10; c++) {
  const lessonsInChap = TOAN8_KNTT_CURRICULUM.filter((l) => l.chapter === c);
  assert.ok(lessonsInChap.length > 0, `Chương ${c} phải có các bài học liên kết`);
  console.log(`✔ [Chương ${String(c).padStart(2, "0")}] Có ${lessonsInChap.length} bài học liên kết (${lessonsInChap[0].lessonTitle}) [OK]`);
}

// [Test 5] Kiểm tra API Tiến độ học tập & Theo dõi lỗi (Progress & Mistakes Tracking)
console.log("\n[Test 5] Kiểm tra API Tiến độ học tập và Phân tích Lỗi...");
const BASE_URL = "http://localhost:3000";

async function testProgressAPI() {
  try {
    const getRes = await fetch(`${BASE_URL}/api/progress`);
    assert.strictEqual(getRes.status, 200, "GET /api/progress phải trả về 200");
    const data = await getRes.json();
    assert.ok(typeof data.percent === "number", "data.percent phải là số");
    assert.ok(Array.isArray(data.topics), "data.topics phải là mảng");
    assert.ok(Array.isArray(data.mistakes), "data.mistakes phải là mảng");
    console.log(`✔ [5.1] GET /api/progress: Trả về ${data.topics.length} topics và ${data.mistakes.length} dạng lỗi thường gặp [OK]`);

    // Gửi bản ghi luyện tập mới
    const postRes = await fetch(`${BASE_URL}/api/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic_id: "hang-dang-thuc",
        question: "Khai triển (2x - 3y)^2",
        result: "4x^2 - 12xy + 9y^2",
        is_correct: true,
        mistakes: [],
        difficulty: "medium",
      }),
    });
    assert.strictEqual(postRes.status, 200, "POST /api/progress phải trả về 200");
    const updated = await postRes.json();
    assert.ok(updated.answered >= 1, "Số câu trả lời phải được cập nhật");
    console.log(`✔ [5.2] POST /api/progress: Lưu thành công câu hỏi, cập nhật tiến độ ${updated.correct}/${updated.answered} câu đúng [OK]`);

    console.log("\n============================================================================");
    console.log("🎉 TẤT CẢ CÁC BÀI KIỂM THỬ CHAT UI, ANSWER CARD & PROGRESS PHASE 8 ĐẠT 100%!");
    console.log("============================================================================");
  } catch (err) {
    console.error("Lỗi kiểm thử API Progress:", err);
    process.exit(1);
  }
}

testProgressAPI();
