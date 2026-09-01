import { logger } from "../security/logger.ts";
import { env } from "../security/env.ts";

export interface SystemKeyInfo {
  id: string;
  key: string;
  label: string;
  addedAt: string;
  failCount: number;
  lastUsedAt?: string;
  isActive: boolean;
}

// Danh sách ban đầu ít nhất 2 API Key mặc định của hệ thống
// Admin có thể cấu hình qua biến môi trường DEFAULT_GEMINI_API_KEYS hoặc qua Admin Dashboard
const initialKeysFromEnv: string[] = [];

if (env.GEMINI_ADMIN_API_KEY) {
  initialKeysFromEnv.push(env.GEMINI_ADMIN_API_KEY);
}

const envKeysStr = process.env.DEFAULT_GEMINI_API_KEYS;
if (envKeysStr) {
  const parts = envKeysStr.split(",").map((k) => k.trim()).filter(Boolean);
  for (const p of parts) {
    if (!initialKeysFromEnv.includes(p)) {
      initialKeysFromEnv.push(p);
    }
  }
}

// Đảm bảo luôn có ít nhất 2 slot keys hệ thống sẵn sàng
const systemKeyPool: SystemKeyInfo[] = [];

if (initialKeysFromEnv.length > 0) {
  initialKeysFromEnv.forEach((k, idx) => {
    systemKeyPool.push({
      id: `sys_key_${idx + 1}`,
      key: k,
      label: `System Key #${idx + 1}`,
      addedAt: new Date().toISOString(),
      failCount: 0,
      isActive: true,
    });
  });
}

// Nếu chưa có key nào trong env, nạp 2 placeholder slot để admin nhập trực tiếp từ dashboard
if (systemKeyPool.length < 2) {
  const needed = 2 - systemKeyPool.length;
  for (let i = 0; i < needed; i++) {
    const slotNum = systemKeyPool.length + 1;
    systemKeyPool.push({
      id: `sys_key_${slotNum}`,
      key: process.env.GEMINI_API_KEY || `AIzaSy_SYSTEM_DEFAULT_KEY_SLOT_${slotNum}`,
      label: `System Key #${slotNum} (Mặc định cho học sinh)`,
      addedAt: new Date().toISOString(),
      failCount: 0,
      isActive: true,
    });
  }
}

let currentIndex = 0;

/**
 * Lấy API key tiếp theo từ Pool theo thuật toán Round-Robin với tự động Failover
 */
export function getNextSystemKey(): string {
  const activeKeys = systemKeyPool.filter((k) => k.isActive);
  if (activeKeys.length === 0) {
    // Fallback nếu tất cả bị tạm khóa
    return systemKeyPool[0]?.key || "AIzaSy_SYSTEM_FALLBACK_KEY";
  }

  currentIndex = (currentIndex + 1) % activeKeys.length;
  const selected = activeKeys[currentIndex];
  selected.lastUsedAt = new Date().toISOString();

  logger.info(`Đang sử dụng ${selected.label} từ Pool hệ thống cho học sinh.`);
  return selected.key;
}

/**
 * Lấy tóm tắt danh sách Key trong Pool phục vụ Admin UI (đã che giấu ký tự bảo mật)
 */
export function getSystemKeyPoolSummary(): {
  total: number;
  activeCount: number;
  keys: { id: string; label: string; maskedKey: string; addedAt: string; isActive: boolean; failCount: number }[];
} {
  return {
    total: systemKeyPool.length,
    activeCount: systemKeyPool.filter((k) => k.isActive).length,
    keys: systemKeyPool.map((k) => {
      const raw = k.key || "";
      const masked =
        raw.length > 10
          ? `${raw.substring(0, 7)}...${raw.substring(raw.length - 4)}`
          : "Chưa cấu hình";

      return {
        id: k.id,
        label: k.label,
        maskedKey: masked,
        addedAt: k.addedAt,
        isActive: k.isActive,
        failCount: k.failCount,
      };
    }),
  };
}

/**
 * Thêm một API key mới vào Pool do Quản trị viên nhập
 */
export function addSystemKeyToPool(newKey: string, customLabel?: string): boolean {
  if (!newKey || typeof newKey !== "string" || newKey.trim().length < 10) {
    return false;
  }

  const clean = newKey.trim();
  const existing = systemKeyPool.find((k) => k.key === clean);
  if (existing) {
    existing.isActive = true;
    existing.failCount = 0;
    return true;
  }

  const slotNum = systemKeyPool.length + 1;
  systemKeyPool.push({
    id: `sys_key_${Date.now()}`,
    key: clean,
    label: customLabel || `System Key #${slotNum} (Admin thêm)`,
    addedAt: new Date().toISOString(),
    failCount: 0,
    isActive: true,
  });

  logger.info(`Admin đã thêm thành công 1 API key mới vào System Pool (Tổng: ${systemKeyPool.length} keys).`);
  return true;
}

/**
 * Xóa hoặc vô hiệu hóa key khỏi Pool
 */
export function removeSystemKeyFromPool(keyId: string): boolean {
  const index = systemKeyPool.findIndex((k) => k.id === keyId);
  if (index !== -1) {
    systemKeyPool.splice(index, 1);
    logger.info(`Đã xóa key ${keyId} khỏi System Pool.`);
    return true;
  }
  return false;
}

/**
 * Ghi nhận lỗi khi gọi API để luân chuyển sang key khác trong Pool
 */
export function recordKeyFailure(failedKey: string): void {
  const found = systemKeyPool.find((k) => k.key === failedKey);
  if (found) {
    found.failCount += 1;
    if (found.failCount >= 3) {
      logger.warn(`${found.label} gặp lỗi liên tiếp 3 lần, tạm thời luân chuyển sang key khác.`);
    }
  }
}
