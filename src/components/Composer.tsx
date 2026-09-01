"use client";

import React, { useRef, useState, useEffect } from "react";
import { Paperclip, Send, X, Image as ImageIcon } from "lucide-react";
import { LearningMode } from "@/types/chat";

interface ComposerProps {
  onSend: (text: string, imageFile?: File | null) => void;
  busy: boolean;
  connected: boolean;
  onOpenKeyModal: () => void;
  currentMode: LearningMode;
}

const PLACEHOLDERS: Record<LearningMode, string> = {
  EXPLAIN: "Nhập câu hỏi kiến thức Toán 8 của em (VD: Giải thích hằng đẳng thức hiệu hai bình phương)...",
  SOLVE: "Nhập đề bài toán cần giải hoặc đính kèm ảnh bài toán...",
  HINT: "Nhập bài toán và cho mình biết em đang vướng ở bước nào nhé...",
  PRACTICE: "Ví dụ: Cho em 5 bài luyện tập về phân tích đa thức thành nhân tử...",
  QUIZ: "Ví dụ: Tạo 5 câu trắc nghiệm về định lý Thales và tam giác đồng dạng...",
  CHECK_ANSWER: "Dán bài giải của em vào đây để mình kiểm tra từng bước giúp em...",
  FIND_EXERCISE: "Nhập số bài và số trang SGK/SBT (VD: Bài 1.5 trang 12 SGK Toán 8 tập 1)...",
};

export const Composer: React.FC<ComposerProps> = ({
  onSend,
  busy,
  connected,
  onOpenKeyModal,
  currentMode,
}) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Chỉ hỗ trợ file ảnh PNG, JPG hoặc WEBP.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 6 MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (busy) return;

    if (!connected) {
      onOpenKeyModal();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed && !selectedFile) return;

    onSend(trimmed, selectedFile);
    setText("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-line bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl rounded-2xl border border-line bg-white p-2.5 shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
      >
        {/* File Preview nếu có */}
        {selectedFile && (
          <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-1.5 text-xs text-slate-700 border border-slate-200">
            <div className="flex items-center gap-2 truncate">
              <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate font-medium">{selectedFile.name}</span>
              <span className="text-slate-400">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className="p-1 hover:text-red-500 rounded-md transition-colors"
              title="Xóa ảnh"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[currentMode] || PLACEHOLDERS.EXPLAIN}
          rows={1}
          className="w-full resize-none border-0 bg-transparent px-2 py-1.5 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none leading-relaxed"
          style={{ minHeight: "44px", maxHeight: "180px" }}
        />

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 mt-1">
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="flex items-center gap-1.5 cursor-pointer rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Paperclip className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Ảnh bài toán</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={busy || (!text.trim() && !selectedFile)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span>{busy ? "Đang giải..." : "Gửi"}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      <div className="mx-auto max-w-4xl mt-2 text-center text-[11px] text-slate-400">
        Không nhập API key vào ô chat. API key chỉ được gửi bảo mật qua màn hình Kết nối AI.
      </div>
    </div>
  );
};
