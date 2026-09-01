"use client";

import React from "react";
import Link from "next/link";
import { Menu, Sparkles, LogOut, Key } from "lucide-react";

interface TopbarProps {
  connected: boolean;
  onOpenKeyModal: () => void;
  onDisconnect: () => void;
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  connected,
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
        {/* Link tới trang chuyên biệt /connect-ai */}
        <Link
          href="/connect-ai"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          title="Trang quản lý API Key"
        >
          <Key className="w-3.5 h-3.5 text-slate-500" />
          <span>Cấu hình Key</span>
        </Link>

        {/* Status Pill */}
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border ${
            connected
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span>{connected ? "AI đã kết nối" : "Chưa kết nối AI"}</span>
        </div>

        {connected ? (
          <button
            onClick={onDisconnect}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ngắt kết nối</span>
          </button>
        ) : (
          <button
            onClick={onOpenKeyModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kết nối AI</span>
          </button>
        )}
      </div>
    </header>
  );
};
