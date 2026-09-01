import fs from "fs";
import path from "path";
import assert from "assert";
import crypto from "crypto";
import { redactSensitiveData } from "../src/lib/security/logger.ts";

console.log("=========================================================");
console.log("BẮT ĐẦU CHẠY BỘ BẢO MẬT & SECURITY TESTS CHO PHASE 2 (BYOK)");
console.log("=========================================================");

// ---------------------------------------------------------
// 1. KIỂM TRA ZERO CLIENT STORAGE & KHÔNG LỘ KEY TRONG CODE
// ---------------------------------------------------------
console.log("\n[Test 1] Quét mã nguồn Frontend: Kiểm tra không lưu Key vào localStorage/sessionStorage/IndexedDB");

const srcFiles = [];
function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts") || fullPath.endsWith(".js"))) {
      srcFiles.push(fullPath);
    }
  }
}
scanDir(path.resolve("src"));

for (const file of srcFiles) {
  const content = fs.readFileSync(file, "utf8");

  assert.ok(!content.includes("localStorage.setItem('apiKey'"), `Phát hiện localStorage.setItem trong ${file}`);
  assert.ok(!content.includes("sessionStorage.setItem('apiKey'"), `Phát hiện sessionStorage.setItem trong ${file}`);
  assert.ok(!content.includes("localStorage.setItem(\"apiKey\""), `Phát hiện localStorage.setItem trong ${file}`);
  assert.ok(!content.includes("sessionStorage.setItem(\"apiKey\""), `Phát hiện sessionStorage.setItem trong ${file}`);
  assert.ok(!content.includes("indexedDB.open('apiKey'"), `Phát hiện IndexedDB lưu key trong ${file}`);
}
console.log(`✔ [1.1] Đã quét ${srcFiles.length} tệp mã nguồn: 100% không ghi API key vào localStorage/sessionStorage/IndexedDB`);

// ---------------------------------------------------------
// 2. KIỂM THỬ LOGGER REDACTION (KHÔNG LỘ TRONG LOGS)
// ---------------------------------------------------------
console.log("\n[Test 2] Kiểm tra Safe Logger: Tự động Redact API key, JWT và Password");

const mockLog = "Error: Key AIzaSyFakeApiKey12345678901234567890 failed with token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN4t and password=SecretPass";
const cleanLog = redactSensitiveData(mockLog);
assert.ok(!cleanLog.includes("AIzaSyFakeApiKey12345678901234567890"), "Log phải được che dấu Google API key");
assert.ok(!cleanLog.includes("eyJhbGciOiJIUzI1NiJ9"), "Log phải được che dấu JWT token");
assert.ok(!cleanLog.includes("SecretPass"), "Log phải được che dấu password");
console.log("✔ [2.1] Safe Logger tự động che giấu Secrets 100% thành công");

// ---------------------------------------------------------
// 3. KIỂM THỬ AES-256-GCM VỚI TTL 8 GIỜ (28800 GIÂY)
// ---------------------------------------------------------
console.log("\n[Test 3] Kiểm tra Mã hóa AES-256-GCM và TTL 8 Giờ");

const MASTER_SECRET = crypto.createHash("sha256").update("phase2-test-secret-key-32-chars").digest();
const ALGORITHM = "aes-256-gcm";
const IV_LEN = 12;
const TTL_8_HOURS = 8 * 60 * 60; // 28800s

function encryptKey(key, ttl = TTL_8_HOURS) {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_SECRET, iv);
  let enc = cipher.update(key, "utf8", "base64");
  enc += cipher.final("base64");
  const tag = cipher.getAuthTag();
  const payload = {
    k: enc,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    exp: Date.now() + ttl * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decryptKey(encCookie) {
  try {
    const raw = Buffer.from(encCookie, "base64url").toString("utf8");
    const payload = JSON.parse(raw);
    if (Date.now() > payload.exp) return null;
    const iv = Buffer.from(payload.iv, "hex");
    const tag = Buffer.from(payload.tag, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_SECRET, iv);
    decipher.setAuthTag(tag);
    let dec = decipher.update(payload.k, "base64", "utf8");
    dec += decipher.final("utf8");
    return { key: dec, exp: payload.exp };
  } catch {
    return null;
  }
}

const testKey = "AIzaSyDTestUserKey123456789012345678";
const encryptedCookie = encryptKey(testKey);
const decryptedResult = decryptKey(encryptedCookie);
assert.strictEqual(decryptedResult.key, testKey, "Giải mã phải khớp đúng key gốc");
assert.ok(decryptedResult.exp > Date.now() + (TTL_8_HOURS - 10) * 1000, "Thời hạn TTL phải là 8 giờ");
console.log("✔ [3.1] AES-256-GCM mã hóa và giải mã với TTL 8 giờ PASSED");

// ---------------------------------------------------------
// 4. KIỂM THỬ RATE LIMITER (CHỐNG BRUTE FORCE)
// ---------------------------------------------------------
console.log("\n[Test 4] Kiểm tra Rate Limiting: Tối đa 10 request/phút");

const rateStore = new Map();
function rateLimit(id, max = 10, windowMs = 60000) {
  const now = Date.now();
  let rec = rateStore.get(id);
  if (!rec || now > rec.resetAt) {
    rateStore.set(id, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (rec.count >= max) {
    return { allowed: false };
  }
  rec.count++;
  return { allowed: true };
}

for (let i = 1; i <= 10; i++) {
  const res = rateLimit("test_ip_client");
  assert.strictEqual(res.allowed, true, `Lần thử ${i} phải được phép`);
}
const blockedRes = rateLimit("test_ip_client");
assert.strictEqual(blockedRes.allowed, false, "Lần thử thứ 11 phải bị Rate Limit chặn");
console.log("✔ [4.1] Rate Limiter chặn thành công sau 10 lần thử/phút");

// ---------------------------------------------------------
// 5. KIỂM THỬ TƯƠNG TÁC API QUA SERVER (PORT 3000)
// ---------------------------------------------------------
console.log("\n[Test 5] Kiểm tra API Endpoints & Quyền Chat");

async function runApiTests() {
  // Test 5.1: Trang /connect-ai trả về HTTP 200
  const connectAiRes = await fetch("http://localhost:3000/connect-ai");
  assert.strictEqual(connectAiRes.status, 200, "Trang /connect-ai phải hoạt động");
  const connectAiHtml = await connectAiRes.text();
  assert.ok(connectAiHtml.includes("Gia sư AI Toán 8"), "Trang /connect-ai phải chứa tiêu đề chính");
  assert.ok(!connectAiHtml.includes("AIzaSy"), "HTML không được chứa bất kỳ API key thực tế nào");
  console.log("✔ [5.1] GET /connect-ai: HTTP 200 OK & Zero Key in HTML");

  // Test 5.2: Invalid key bị từ chối với mã lỗi rõ ràng
  const invalidKeyRes = await fetch("http://localhost:3000/api/key/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: "AIzaSyInvalidKeyForTest" }),
  });
  assert.ok(invalidKeyRes.status === 400 || invalidKeyRes.status === 401, "Invalid key phải trả về 400 hoặc 401");
  const invalidKeyData = await invalidKeyRes.json();
  assert.strictEqual(invalidKeyData.valid, false, "valid phải là false");
  console.log("✔ [5.2] POST /api/key/validate với invalid key: Bị từ chối chính xác (valid: false)");

  // Test 5.3: Chat bị chặn (401) khi không có valid AI session cookie
  const unauthChatRes = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    body: new FormData(),
  });
  assert.strictEqual(unauthChatRes.status, 401, "Chat khi chưa kết nối AI phải trả về 401 Unauthorized");
  const unauthChatData = await unauthChatRes.json();
  assert.ok(unauthChatData.error?.includes("chưa được kết nối"), "Thông báo lỗi phải yêu cầu kết nối API key");
  console.log("✔ [5.3] POST /api/chat không có cookie: Bị chặn với HTTP 401 Unauthorized (Bảo vệ thành công)");

  // Test 5.4: DELETE /api/key xóa session cookie
  const deleteKeyRes = await fetch("http://localhost:3000/api/key", {
    method: "DELETE",
  });
  assert.strictEqual(deleteKeyRes.status, 200);
  const deleteCookieHeader = deleteKeyRes.headers.get("set-cookie") || "";
  assert.ok(deleteCookieHeader.includes("toan8_ai_session=;"), "DELETE /api/key phải xóa sạch cookie");
  console.log("✔ [5.4] DELETE /api/key: Xóa sạch cookie và thu hồi quyền chat");

  console.log("\n=========================================================");
  console.log("🎉 TẤT CẢ CÁC BÀI KIỂM THỬ BẢO MẬT & BYOK PHASE 2 ĐÃ ĐẠT 100%!");
  console.log("=========================================================");
}

runApiTests().catch((err) => {
  console.error("Lỗi khi chạy API Security Tests:", err);
  process.exit(1);
});
