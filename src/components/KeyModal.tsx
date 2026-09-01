"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Key, ShieldCheck, X, AlertCircle, CheckCircle2 } from "lucide-react";

interface KeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const KeyModal: React.FC<KeyModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alertState, setAlertState] = useState<{ type: "error" | "success"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setAlertState({ type: "error", text: "Vui lòng nhập Google AI API key của bạn." });
      return;
    }

    setBusy(true);
    setAlertState(null);

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
        setAlertState({ type: "success", text: "Kết nối Google AI thành công!" });
        setApiKey("");
        onConnected();
        setTimeout(() => {
          onClose();
          setAlertState(null);
        }, 600);
      } else {
        const errorMsg = data.message || (res.status === 401 ? "API key không hợp lệ hoặc đã hết hạn." : "Lỗi xác thực.");
        setAlertState({ type: "error", text: errorMsg });
      }
    } catch (err: any) {
      setAlertState({
        type: "error",
        text: err.message || "Không thể kết nối đến máy chủ xác thực.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Kết nối Google AI</h2>
            <p className="text-xs text-slate-500">Mã hóa AES-256-GCM an toàn chuẩn bảo mật · TTL 8 giờ</p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Nhập Google AI API key của bạn. Trình duyệt <strong>không lưu key</strong> vào bất kỳ bộ nhớ cục bộ nào (localStorage, sessionStorage, IndexedDB).
        </p>

        {alertState && (
          <div
            className={`mt-4 flex items-center gap-2.5 rounded-xl p-3 text-xs font-medium ${
              alertState.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {alertState.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{alertState.text}</span>
          </div>
        )}

        <form onSubmit={handleValidate} className="mt-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Google AI API Key (Gemini)
          </label>

          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Nhập Google AI API key..."
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
              aria-label={showKey ? "Ẩn key" : "Hiện key"}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 border border-slate-200/80 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Key sẽ được chuyển qua HTTPS tới backend để kiểm tra với Google GenAI SDK, sau đó mã hóa bằng <strong>AES-256-GCM</strong> và lưu trong HttpOnly Secure cookie (TTL: 8 giờ).
            </span>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={busy || !apiKey.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {busy ? "Đang xác thực..." : "Kiểm tra kết nối"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
