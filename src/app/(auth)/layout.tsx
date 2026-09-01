import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 sm:p-6">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl font-black text-white shadow-xl shadow-blue-500/25">
            ∑
          </div>
        </Link>
        <h1 className="mt-3 text-2xl font-black text-slate-900">Gia sư AI Toán 8</h1>
        <p className="text-xs text-slate-500 mt-1">Hệ thống học tập và ôn luyện Toán 8 thông minh</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
        {children}
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        Bảo mật bởi Supabase Authentication & AES-256-GCM
      </div>
    </div>
  );
}
