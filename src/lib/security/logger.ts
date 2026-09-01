/**
 * Safe Logger Module
 * Tự động che dấu (redact) các thông tin nhạy cảm như API keys, tokens, mật khẩu trước khi in log.
 */

const SENSITIVE_PATTERNS = [
  /AIza[0-9A-Za-z-_]{20,}/g, // Google AI API Key pattern
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, // JWT Tokens
  /(password|passwd|secret|apiKey|api_key|token|auth_token)\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
];

export function redactSensitiveData(data: any): any {
  if (typeof data === "string") {
    let sanitized = data;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, (match, p1) => {
        if (p1) return `${p1}=***REDACTED***`;
        return "***REDACTED_SECRET***";
      });
    }
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  if (typeof data === "object" && data !== null) {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("key") ||
        lowerKey.includes("password") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey.includes("cookie") ||
        lowerKey.includes("authorization")
      ) {
        sanitizedObj[key] = "***REDACTED***";
      } else {
        sanitizedObj[key] = redactSensitiveData(data[key]);
      }
    }
    return sanitizedObj;
  }

  return data;
}

export const logger = {
  info(message: string, ...args: any[]) {
    console.log(`[INFO] ${new Date().toISOString()} - ${redactSensitiveData(message)}`, ...args.map(redactSensitiveData));
  },
  warn(message: string, ...args: any[]) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${redactSensitiveData(message)}`, ...args.map(redactSensitiveData));
  },
  error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${redactSensitiveData(message)}`, ...args.map(redactSensitiveData));
  },
  debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${redactSensitiveData(message)}`, ...args.map(redactSensitiveData));
    }
  },
};
