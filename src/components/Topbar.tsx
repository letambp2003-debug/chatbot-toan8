"use client";

import React from "react";
import Link from "next/link";
import { Menu, Sparkles, LogOut, Key, ShieldCheck } from "lucide-react";

interface TopbarProps {
  connected: boolean;
  isCustomKey?: boolean;
  onOpenKeyModal: () => void;
  onDisconnect: () => void;
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  connected,
  isCustomKey = false,
  onOpenKeyModal,
  onDisconnect,
  onToggleSidebar,
}) => {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-lg font-black text-white shadow-lg shadow-blue-500/25">
            ∑
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-1.5">
              Gia sư AI Toán 8
            </h1>
            <p className="hidden sm:block text-xs text-slate-500">
              Học theo SGK · Luyện theo SBT · Kiểm soát phạm vi Toán 8
            </p>
          </div>
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Link tới trang quản trị Admin */}
        <Link
          href="/admin"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          title="Quản trị Tri thức & Pool API Key"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Quản trị QA</span>
        </Link>

        {/* Status Pill */}
        <div
          onClick={onOpenKeyModal}
          className="cursor-pointer inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors"
          title="Bấm để thay đổi cấu hình API Key"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {isCustomKey ? "AI Key Cá Nhân (8h)" : "AI Key Hệ Thống (Mặc định)"}
          </span>
        </div>

        {isCustomKey ? (
          <button
            onClick={onDisconnect}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
            title="Ngắt kết nối key cá nhân, chuyển về dùng key hệ thống"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dùng Key Mặc Định</span>
          </button>
        ) : (
          <button
            onClick={onOpenKeyModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            title="Nhập API Key cá nhân của bạn"
          >
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Dùng Key Riêng</span>
          </button>
        )}
      </div>
    </header>
  );
};
