import assert from "assert";

console.log("=== KIỂM THỬ CÁC ROUTE VÀ GIAO DIỆN TRÊN SERVER ĐANG CHẠY (PORT 3000) ===");

async function testRoutes() {
  // 1. Test Trang chủ (Student Chat)
  const homeRes = await fetch("http://localhost:3000/");
  assert.strictEqual(homeRes.status, 200, "Trang chủ phải trả về status 200");
  const homeText = await homeRes.text();
  assert.ok(homeText.includes("Gia sư AI Toán 8"), "Trang chủ phải chứa tiêu đề Gia sư AI Toán 8");
  console.log("✔ [Route 1] GET / (Trang chủ Học sinh): HTTP 200 OK");

  // 2. Test Trang Đăng nhập (/login)
  const loginRes = await fetch("http://localhost:3000/login");
  assert.strictEqual(loginRes.status, 200, "Trang login phải trả về status 200");
  const loginText = await loginRes.text();
  assert.ok(loginText.includes("Gia sư AI Toán 8"), "Trang login phải tải HTML layout thành công");
  console.log("✔ [Route 2] GET /login (Đăng nhập): HTTP 200 OK");

  // 3. Test Trang Đăng ký (/register)
  const registerRes = await fetch("http://localhost:3000/register");
  assert.strictEqual(registerRes.status, 200, "Trang register phải trả về status 200");
  const registerText = await registerRes.text();
  assert.ok(registerText.includes("Tạo tài khoản mới"), "Trang register phải chứa form đăng ký");
  console.log("✔ [Route 3] GET /register (Đăng ký): HTTP 200 OK");

  // 4. Test Protected Route (/admin) - Phải redirect về /login khi chưa auth
  const adminRes = await fetch("http://localhost:3000/admin", { redirect: "manual" });
  assert.strictEqual(adminRes.status, 307, "Protected route /admin phải trả về redirect 307 khi chưa đăng nhập");
  const location = adminRes.headers.get("location");
  assert.ok(location?.includes("/login"), "Redirect location phải trỏ đến /login");
  console.log("✔ [Route 4] Protected Route GET /admin -> Redirected to /login (Bảo vệ thành công)");

  // 5. Test API Key Status
  const keyStatusRes = await fetch("http://localhost:3000/api/key/status");
  assert.strictEqual(keyStatusRes.status, 200);
  const keyStatusData = await keyStatusRes.json();
  assert.strictEqual(keyStatusData.connected, false, "Mặc định khi chưa có cookie thì connected = false");
  console.log("✔ [Route 5] GET /api/key/status -> { connected: false } OK");

  // 6. Test Learning Progress API
  const progressRes = await fetch("http://localhost:3000/api/progress");
  assert.strictEqual(progressRes.status, 200);
  const progressData = await progressRes.json();
  assert.ok(typeof progressData.percent === "number", "Tiến độ phải trả về số phần trăm");
  console.log("✔ [Route 6] GET /api/progress ->", progressData.label, "OK");

  // 7. Test Admin Status API
  const adminStatusRes = await fetch("http://localhost:3000/api/admin/status");
  assert.strictEqual(adminStatusRes.status, 200);
  const adminStatusData = await adminStatusRes.json();
  assert.ok(adminStatusData.status === "ready", "Admin status API phải sẵn sàng");
  console.log("✔ [Route 7] GET /api/admin/status -> status: ready OK");

  console.log("=========================================================");
  console.log("🎉 TẤT CẢ 7/7 HTTP ROUTES VÀ BẢO VỆ ROUTE ĐỀU HOẠT ĐỘNG HOÀN HẢO!");
  console.log("=========================================================");
}

testRoutes().catch((err) => {
  console.error("Lỗi kiểm thử HTTP:", err);
  process.exit(1);
});
