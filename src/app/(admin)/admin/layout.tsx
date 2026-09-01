import React from "react";
import Link from "next/link";
import { Database, BookOpen, Shield, Settings, ArrowLeft } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100 antialiased">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white p-5 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-black text-lg shadow-md">
              ∑
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-tight">Admin Portal</h1>
              <p className="text-[11px] text-slate-500 font-medium">Gia sư AI Toán 8</p>
            </div>
          </div>

          <div className="space-y-1 text-xs font-bold text-slate-600">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl bg-blue-50 px-3.5 py-2.5 text-blue-700 font-bold border border-blue-100"
            >
              <Database className="w-4 h-4" />
              <span>Kho tri thức SGK/SBT</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Giao diện học sinh</span>
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
