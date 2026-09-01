"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "@/lib/security/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Global Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600 mb-4 shadow-lg shadow-red-500/10">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-black text-slate-900">Đã xảy ra sự cố</h2>
      <p className="mt-2 text-sm text-slate-600 max-w-md">
        Hệ thống Gia sư AI Toán 8 gặp lỗi không mong muốn. Em hãy thử tải lại trang hoặc thử lại nhé.
      </p>

      <button
        onClick={() => reset()}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Thử lại</span>
      </button>
    </div>
  );
}
