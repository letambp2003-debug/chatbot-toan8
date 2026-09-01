import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-600 mb-4 font-black text-2xl">
        404
      </div>
      <h2 className="text-2xl font-black text-slate-900">Không tìm thấy trang</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        Trang em đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>

      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Về phòng học Toán 8</span>
      </Link>
    </div>
  );
}
