"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  Sparkles,
  LogOut,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

type ValidationState =
  | "idle"
  | "validating"
  | "success"
  | "invalid_key"
  | "quota_exceeded"
  | "permission_denied"
  | "network_error"
  | "rate_limited";

export default function ConnectAiPage() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [state, setState] = useState<ValidationState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [isCustomKey, setIsCustomKey] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/key/status");
      const data = await res.json();
      setConnected(Boolean(data.connected));
      setIsCustomKey(Boolean(data.isCustomKey));
      if (data.expiresAt) {
        setExpiresAt(data.expiresAt);
      } else {
        setExpiresAt(null);
      }
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setState("invalid_key");
      setFeedbackMessage("Vui lòng nhập Google AI API key của bạn.");
      return;
    }

    setState("validating");
    setFeedbackMessage("");

    try {
      const res = await fetch("/api/key/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: trimmedKey }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setState("success");
        setFeedbackMessage(data.message || "Kết nối Google AI thành công! Phiên làm việc có hiệu lực trong 8 giờ.");
        setConnected(true);
        setIsCustomKey(true);
        setApiKey("");
        await checkStatus();
      } else {
        const reason: ValidationState = data.reason || "invalid_key";
        setState(reason);
        setFeedbackMessage(data.message || "Không thể xác thực API key.");
      }
    } catch (err: any) {
      setState("network_error");
      setFeedbackMessage("Lỗi kết nối mạng hoặc không thể liên lạc với máy chủ.");
    }
  };

  const handleUseDefaultKey = async () => {
    try {
      await fetch("/api/key", { method: "DELETE" });
      setState("success");
      setFeedbackMessage("Đã kích hoạt AI Key mặc định của hệ thống! Em có thể bắt đầu hỏi bài ngay.");
      await checkStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/key", { method: "DELETE" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsCustomKey(false);
      setExpiresAt(null);
      setState("idle");
      setFeedbackMessage("Đã chuyển về sử dụng Google AI Key mặc định của hệ thống.");
      await checkStatus();
    }
  };

  const getRemainingTime = () => {
    if (!expiresAt) return null;
    const diffMin = Math.max(0, Math.round((expiresAt - Date.now()) / 60000));
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours} giờ ${mins} phút`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between antialiased">
      {/* Top Header */}
      <header className="flex h-16 w-full items-center justify-between border-b border-line bg-white px-6">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Về phòng học Toán 8</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Gia sư AI Toán 8</span>
          <div className="h-2 w-2 rounded-full bg-blue-600" />
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-xl rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          {/* Header Title */}
          <div className="flex items-center gap-3.5 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Cấu Hình Google AI API Key
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pool Key Mặc Định Hệ Thống hoặc Key Riêng Cá Nhân (BYOK)
              </p>
            </div>
          </div>

          {/* Banner thông báo Key mặc định */}
          <div className="my-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-black text-emerald-900">
                  {isCustomKey ? "Đang Dùng Key Cá Nhân (8h)" : "Đang Dùng Key Mặc Định Của Hệ Thống"}
                </span>
              </div>

              {isCustomKey ? (
                <button
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Dùng Key Mặc Định</span>
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Vào Học Ngay</span>
                </Link>
              )}
            </div>

            {isCustomKey && expiresAt && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <Clock className="w-3.5 h-3.5" />
                <span>Thời gian phiên còn lại: <strong>{getRemainingTime()}</strong></span>
              </div>
            )}
          </div>

          {/* Alert Status Feedback */}
          {state !== "idle" && (
            <div
              className={`my-4 flex items-start gap-3 rounded-2xl p-4 text-xs sm:text-sm font-semibold border ${
                state === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : state === "validating"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : state === "quota_exceeded" || state === "rate_limited"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {state === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {state === "validating" && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />}
              {state === "quota_exceeded" && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
              {state === "rate_limited" && <Clock className="w-5 h-5 text-amber-600 shrink-0" />}
              {(state === "invalid_key" || state === "permission_denied" || state === "network_error") && (
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div className="flex-1 leading-relaxed">{feedbackMessage}</div>
            </div>
          )}

          {/* Key Input Form */}
          <form onSubmit={handleValidate} className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Nhập Key Riêng Cá Nhân (Tùy chọn)</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                >
                  <span>Lấy key tại Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Nhập Google AI API key cá nhân (AIzaSy...)..."
                  autoComplete="off"
                  disabled={state === "validating"}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 font-mono transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600"
                  aria-label={showKey ? "Ẩn key" : "Hiện key"}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security Guarantee Box */}
            <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Cam kết bảo mật:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500 leading-relaxed">
                <li>Không lưu vào localStorage hay sessionStorage.</li>
                <li>Mã hóa <strong>AES-256-GCM</strong> và lưu trong HttpOnly Secure Cookie với TTL 8 giờ.</li>
                <li>Nếu không nhập key riêng, học sinh vẫn có thể dùng bình thường nhờ Pool Key do Quản trị viên cấp.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleUseDefaultKey}
                className="w-full sm:w-auto rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-colors text-center"
              >
                Dùng Key Hệ Thống Mặc Định
              </button>

              <button
                type="submit"
                disabled={state === "validating" || !apiKey.trim()}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {state === "validating" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang kiểm tra kết nối...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Lưu Key Cá Nhân</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Gia sư AI Toán 8 · Chuẩn bảo mật BYOK AES-256-GCM
      </footer>
    </div>
  );
}
