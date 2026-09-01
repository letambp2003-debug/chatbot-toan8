"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage, LearningMode } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { Shield, Sparkles, BookOpen, Calculator, HelpCircle, CheckCircle } from "lucide-react";

interface ChatAreaProps {
  messages: ChatMessage[];
  busy: boolean;
  currentMode: LearningMode;
  onQuickPrompt: (prompt: string) => void;
}

const MODE_HEADERS: Record<LearningMode, { title: string; desc: string }> = {
  EXPLAIN: {
    title: "Hỏi bài",
    desc: "Hỏi kiến thức Toán 8 và nhận giải thích chi tiết bám sát SGK/SBT.",
  },
  SOLVE: {
    title: "Giải bài",
    desc: "Gửi đề bài toán và nhận lời giải từng bước, có kiểm tra trước khi hiển thị.",
  },
  HINT: {
    title: "Gợi ý",
    desc: "Nhận gợi ý theo từng mức độ thay vì xem ngay lời giải hoàn chỉnh.",
  },
  PRACTICE: {
    title: "Luyện tập",
    desc: "Tạo các bài tập tương tự đúng chủ đề Toán 8 từ dễ đến nâng cao.",
  },
  QUIZ: {
    title: "Trắc nghiệm",
    desc: "Luyện trắc nghiệm theo chủ đề Toán 8 và kiểm tra sau khi trả lời.",
  },
  CHECK_ANSWER: {
    title: "Kiểm tra đáp án",
    desc: "Gửi bài làm để chatbot chỉ ra phần đúng, lỗi sai và gợi ý cách sửa.",
  },
  FIND_EXERCISE: {
    title: "Tìm bài tập",
    desc: "Tra cứu và giải trực tiếp bài tập SGK/SBT theo số bài và số trang.",
  },
};

const QUICK_PROMPTS = [
  {
    title: "Hằng đẳng thức hiệu hai bình phương",
    prompt: "Giải thích hằng đẳng thức hiệu hai bình phương và cho em một ví dụ minh họa.",
    icon: <Calculator className="w-4 h-4 text-blue-600" />,
  },
  {
    title: "Luyện phân tích đa thức",
    prompt: "Cho em 4 bài luyện tập về phân tích đa thức thành nhân tử từ dễ đến vừa.",
    icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
  },
  {
    title: "Ôn tam giác đồng dạng",
    prompt: "Hướng dẫn em các trường hợp đồng dạng của hai tam giác.",
    icon: <Sparkles className="w-4 h-4 text-amber-600" />,
  },
  {
    title: "Trắc nghiệm nhanh Toán 8",
    prompt: "Tạo 4 câu trắc nghiệm Toán 8 về định lý Thales và chưa đưa đáp án ngay nhé.",
    icon: <CheckCircle className="w-4 h-4 text-purple-600" />,
  },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  busy,
  currentMode,
  onQuickPrompt,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const info = MODE_HEADERS[currentMode] || MODE_HEADERS.EXPLAIN;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/50">
      {/* Context Top Bar */}
      <div className="flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-800">{info.title}</h2>
          <p className="text-xs text-slate-500 line-clamp-1">{info.desc}</p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 border border-emerald-200 shrink-0">
          <Shield className="w-3.5 h-3.5" />
          <span>STRICT TOÁN 8</span>
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            /* Welcome Card */
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Em muốn ôn phần nào hôm nay?</h3>
                  <p className="text-xs text-slate-500">
                    Gia sư AI Toán 8 hỗ trợ bám sát SGK và SBT theo chuẩn bộ giáo dục.
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Em có thể hỏi kiến thức, gửi bài cần giải, yêu cầu gợi ý hoặc kiểm tra bài làm của mình. Hãy chọn nhanh một câu hỏi mẫu bên dưới hoặc nhập câu hỏi của em nhé:
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {QUICK_PROMPTS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onQuickPrompt(q.prompt)}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-all hover:border-blue-300 hover:bg-blue-50/60"
                  >
                    <div className="mt-0.5 rounded-lg bg-white p-1.5 shadow-2xs shrink-0">
                      {q.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{q.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{q.prompt}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}

          {/* Typing Indicator */}
          {busy && (
            <div className="flex items-start gap-1">
              <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm rounded-bl-sm">
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
