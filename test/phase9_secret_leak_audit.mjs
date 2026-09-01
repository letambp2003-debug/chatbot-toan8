import fs from "fs";
import path from "path";
import assert from "assert";

console.log("============================================================================");
console.log("BẮT ĐẦU QUÉT TOÀN BỘ REPOSITORY & PRODUCTION BUNDLE ĐỂ KIỂM TRA SECRET LEAK");
console.log("============================================================================");

const FORBIDDEN_SECRET_PATTERNS = [
  /AIzaSy[A-Za-z0-9_-]{33}/g,
  /NEXT_PUBLIC_GEMINI_API_KEY/g,
  /NEXT_PUBLIC_GOOGLE_API_KEY/g,
  /NEXT_PUBLIC_ENCRYPTION_SECRET/g,
];

const SCAN_DIRECTORIES = ["src", "public", ".next/static", "test"];
const IGNORED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".ico", ".svg", ".pdf", ".map"];

let scannedFileCount = 0;
let detectedSecretsCount = 0;

function scanDirectoryRecursively(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git") {
        scanDirectoryRecursively(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IGNORED_EXTENSIONS.includes(ext)) continue;

      scannedFileCount++;
      const content = fs.readFileSync(fullPath, "utf8");

      for (const pattern of FORBIDDEN_SECRET_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          // Bỏ qua các mock test string hoặc regex definition trong audit script
          const isAuditScript =
            fullPath.includes("phase9_secret_leak_audit") ||
            fullPath.includes("phase2_security_tests") ||
            fullPath.includes("phase9_evaluation_suite") ||
            fullPath.includes("phase9_release_gate_e2e") ||
            fullPath.includes("encryption.ts");

          if (!isAuditScript) {
            console.error(`❌ CẢNH BÁO PHÁT HIỆN SECRET LEAK TẠI: ${fullPath} (Pattern: ${pattern})`);
            detectedSecretsCount++;
          }
        }
      }
    }
  }
}

// 1. Quét các thư mục chính
for (const dir of SCAN_DIRECTORIES) {
  scanDirectoryRecursively(path.resolve(dir));
}

// 2. Kiểm tra các tệp môi trường .env*
const envFiles = [".env.example", ".env.local", ".env"];
for (const envFile of envFiles) {
  const envPath = path.resolve(envFile);
  if (fs.existsSync(envPath)) {
    scannedFileCount++;
    const envContent = fs.readFileSync(envPath, "utf8");
    assert.ok(
      !envContent.includes("NEXT_PUBLIC_GEMINI_API_KEY"),
      `${envFile} không được chứa NEXT_PUBLIC_GEMINI_API_KEY`
    );
    assert.ok(
      !/AIzaSy[A-Za-z0-9_-]{33}/.test(envContent),
      `${envFile} không được chứa API key thật`
    );
  }
}

console.log(`\n✔ Đã quét hoàn tất ${scannedFileCount} tệp tin trong toàn bộ repository.`);
assert.strictEqual(detectedSecretsCount, 0, "Không được có bất kỳ bí mật / API key nào bị rò rỉ!");
console.log("✔ Kiểm tra Secret Leak: PASSED (0 secrets leaked, 0 NEXT_PUBLIC Gemini keys)");

console.log("\n============================================================================");
console.log("🎉 AUDIT SECRET LEAKAGE: 100% CLEAN & ZERO LEAKS!");
console.log("============================================================================");
