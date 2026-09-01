import React from "react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-500/25 animate-pulse">
          ∑
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span>Đang tải Gia sư AI Toán 8...</span>
        </div>
      </div>
    </div>
  );
}
