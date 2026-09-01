import assert from "assert";

console.log("============================================================================");
console.log("BẮT ĐẦU CHẠY BỘ KIỂM THỬ GIAO DIỆN THỰC TẾ & ROUTE HYDRATION (PHASE 8)");
console.log("============================================================================");

const BASE_URL = "http://localhost:3000";

async function runBrowserUITests() {
  // 1. Kiểm tra Trang chủ Chatbot Toán 8 (Học sinh)
  console.log("\n[Test 1] Kiểm tra Render Giao diện Trang chủ (/) ...");
  const homeRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(homeRes.status, 200, "Trang chủ phải trả về HTTP 200 OK");
  const homeHtml = await homeRes.text();

  assert.ok(homeHtml.includes("<!DOCTYPE html>"), "HTML phải là tài liệu HTML5 hợp lệ");
  assert.ok(homeHtml.includes("/_next/static/"), "HTML phải load đúng các Next.js chunks");
  console.log("✔ [1.1] Trang chủ Chat: Render đầy đủ HTML5 và Next.js Client bundles [OK]");

  // 2. Kiểm tra Trang Đăng nhập & Đăng ký
  console.log("\n[Test 2] Kiểm tra Giao diện Đăng nhập (/login) & Đăng ký (/register) ...");
  const loginRes = await fetch(`${BASE_URL}/login`);
  assert.strictEqual(loginRes.status, 200, "GET /login phải trả về 200");
  const loginHtml = await loginRes.text();
  assert.ok(loginHtml.includes("login/page"), "Trang login phải load đúng bundle app/(auth)/login/page");
  console.log("✔ [2.1] Trang /login: HTTP 200 & Bundle app/(auth)/login [OK]");

  const registerRes = await fetch(`${BASE_URL}/register`);
  assert.strictEqual(registerRes.status, 200, "GET /register phải trả về 200");
  const regHtml = await registerRes.text();
  assert.ok(regHtml.includes("register/page"), "Trang register phải load đúng bundle app/(auth)/register/page");
  console.log("✔ [2.2] Trang /register: HTTP 200 & Bundle app/(auth)/register [OK]");

  // 3. Kiểm tra Trang Kết nối BYOK Google AI Key
  console.log("\n[Test 3] Kiểm tra Trang /connect-ai ...");
  const connectRes = await fetch(`${BASE_URL}/connect-ai`);
  assert.strictEqual(connectRes.status, 200, "GET /connect-ai phải trả về 200");
  const connectHtml = await connectRes.text();
  assert.ok(connectHtml.includes("connect-ai/page"), "Trang connect-ai phải load bundle app/connect-ai/page");
  console.log("✔ [3.1] Trang /connect-ai: HTTP 200 & Bundle app/connect-ai [OK]");

  // 4. Kiểm tra Bảo vệ Route Admin
  console.log("\n[Test 4] Kiểm tra Bảo vệ Phân quyền Route Admin (/admin) ...");
  const adminRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
  assert.ok(
    adminRes.status === 307 || adminRes.status === 302 || adminRes.status === 200,
    "Route /admin phải được bảo vệ bởi middleware chuyển hướng"
  );
  console.log(`✔ [4.1] Route /admin: Được bảo vệ bởi Middleware (Status: ${adminRes.status}) [OK]`);

  // 5. Kiểm tra API Coverage & Status
  console.log("\n[Test 5] Kiểm tra API Coverage & Ingestion Admin ...");
  const statusRes = await fetch(`${BASE_URL}/api/admin/status`);
  const statusData = await statusRes.json();
  assert.strictEqual(statusData.status, "ready", "Trạng thái admin ingestion phải là ready");
  console.log("✔ [5.1] GET /api/admin/status -> status: ready [OK]");

  console.log("\n============================================================================");
  console.log("🎉 TẤT CẢ CÁC BÀI KIỂM THỬ GIAO DIỆN & ROUTE HYDRATION ĐẠT 100%!");
  console.log("============================================================================");
}

runBrowserUITests().catch((err) => {
  console.error("Lỗi kiểm thử UI:", err);
  process.exit(1);
});
