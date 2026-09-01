"use client";

import React, { useState } from "react";
import { SourceCitation } from "@/types/knowledge";
import { MathRenderer } from "./MathRenderer";
import {
  Lightbulb,
  Compass,
  FileText,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Sparkles,
  Info,
} from "lucide-react";

interface AnswerCardProps {
  content: string;
  sources?: SourceCitation[];
}

interface ParsedSections {
  knowledge?: string;
  method?: string;
  solution: string;
  conclusion?: string;
  commonMistakes?: string;
}

function parseAnswerSections(rawText: string): ParsedSections {
  const lines = rawText.split("\n");
  let currentSection: "knowledge" | "method" | "solution" | "conclusion" | "mistakes" | "other" = "solution";

  const sections: {
    knowledge: string[];
    method: string[];
    solution: string[];
    conclusion: string[];
    mistakes: string[];
  } = {
    knowledge: [],
    method: [],
    solution: [],
    conclusion: [],
    mistakes: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^#+\s*(kiến thức cần nhớ|em cần nhớ|công thức áp dụng|định lý dùng)/i.test(trimmed)) {
      currentSection = "knowledge";
      continue;
    } else if (/^#+\s*(phân tích( đề)?|cách làm|hướng giải|phương pháp)/i.test(trimmed)) {
      currentSection = "method";
      continue;
    } else if (/^#+\s*(lời giải( chi tiết)?|các bước giải|hướng dẫn giải|bước 1)/i.test(trimmed)) {
      currentSection = "solution";
      continue;
    } else if (/^#+\s*(kết luận|đáp số|đáp án)/i.test(trimmed)) {
      currentSection = "conclusion";
      continue;
    } else if (/^#+\s*(lỗi thường gặp|lưu ý quan trọng|chú ý sai sót)/i.test(trimmed)) {
      currentSection = "mistakes";
      continue;
    }

    if (currentSection === "knowledge") sections.knowledge.push(line);
    else if (currentSection === "method") sections.method.push(line);
    else if (currentSection === "conclusion") sections.conclusion.push(line);
    else if (currentSection === "mistakes") sections.mistakes.push(line);
    else sections.solution.push(line);
  }

  const knowledgeStr = sections.knowledge.join("\n").trim();
  const methodStr = sections.method.join("\n").trim();
  const solutionStr = sections.solution.join("\n").trim() || rawText;
  const conclusionStr = sections.conclusion.join("\n").trim();
  const mistakesStr = sections.mistakes.join("\n").trim();

  return {
    knowledge: knowledgeStr || undefined,
    method: methodStr || undefined,
    solution: solutionStr,
    conclusion: conclusionStr || undefined,
    commonMistakes: mistakesStr || undefined,
  };
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ content, sources }) => {
  const parsed = parseAnswerSections(content);
  const [activeSourceSnippet, setActiveSourceSnippet] = useState<SourceCitation | null>(null);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* 1. KHỐI KIẾN THỨC CẦN NHỚ (Nếu có) */}
      {parsed.knowledge && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-amber-800">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Kiến thức cần nhớ</span>
          </div>
          <MathRenderer content={parsed.knowledge} className="text-sm text-amber-950/90 leading-relaxed" />
        </div>
      )}

      {/* 2. KHỐI PHÂN TÍCH & CÁCH LÀM (Nếu có) */}
      {parsed.method && (
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-blue-800">
            <Compass className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Phân tích & Cách làm</span>
          </div>
          <MathRenderer content={parsed.method} className="text-sm text-blue-950/90 leading-relaxed" />
        </div>
      )}

      {/* 3. KHỐI LỜI GIẢI CHI TIẾT (Trọng tâm) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-700">
          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Lời giải chi tiết</span>
        </div>
        <MathRenderer content={parsed.solution} className="text-[15px] text-slate-900 leading-relaxed" />
      </div>

      {/* 4. KHỐI KẾT LUẬN (Nếu có) */}
      {parsed.conclusion && (
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-black uppercase tracking-wider text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Kết luận</span>
          </div>
          <MathRenderer content={parsed.conclusion} className="text-sm font-semibold text-emerald-950 leading-relaxed" />
        </div>
      )}

      {/* 5. KHỐI LỖI THƯỜNG GẶP (Nếu có) */}
      {parsed.commonMistakes && (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-black uppercase tracking-wider text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Lỗi thường gặp</span>
          </div>
          <MathRenderer content={parsed.commonMistakes} className="text-xs text-rose-950 leading-relaxed" />
        </div>
      )}

      {/* 6. KHỐI NGUỒN THAM KHẢO SGK / SBT (CLICKABLE DRAWER - KHÔNG CÔNG KHAI FULL PDF) */}
      {sources && sources.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden mt-1">
          <button
            type="button"
            onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
            className="w-full flex items-center justify-between bg-slate-50/80 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100/80 transition-colors border-b border-slate-200/60"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Nguồn tham khảo SGK / SBT ({sources.length} trích dẫn)</span>
            </div>
            {isSourcesExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isSourcesExpanded && (
            <div className="divide-y divide-slate-100 text-xs">
              {sources.map((src, idx) => {
                const parts = [
                  src.source_type ? `${src.source_type} Toán 8 (${src.book_set || "KNTT"})` : "Tài liệu Toán 8",
                  src.volume ? `Tập ${src.volume}` : "",
                  src.chapter ? `Chương ${src.chapter}` : "",
                  src.lesson ? `Bài ${src.lesson}` : "",
                  src.exercise_id ? `Bài tập ${src.exercise_id}` : "",
                  src.page ? `Trang ${src.page}` : "",
                ].filter(Boolean);

                const isSelected = activeSourceSnippet?.id === src.id;

                return (
                  <div key={idx} className="transition-colors">
                    <button
                      type="button"
                      onClick={() => setActiveSourceSnippet(isSelected ? null : src)}
                      className="w-full text-left flex items-center justify-between px-4 py-2.5 hover:bg-blue-50/50 group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Bookmark className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                          {src.title || parts.join(" · ") || "SGK/SBT Toán 8"}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full shrink-0">
                        {isSelected ? "Thu gọn" : "Xem đoạn trích"}
                      </span>
                    </button>

                    {/* Đoạn trích an toàn (Chỉ hiển thị đoạn văn bản có thẩm quyền, KHÔNG lộ toàn bộ PDF) */}
                    {isSelected && src.snippet && (
                      <div className="px-4 pb-3 pt-1 bg-blue-50/30 text-slate-600 text-xs leading-relaxed border-t border-blue-100/50">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1 text-[11px]">
                          <Info className="w-3.5 h-3.5 text-blue-500" />
                          <span>Đoạn trích tri thức chuẩn từ SGK/SBT:</span>
                        </div>
                        <p className="italic bg-white p-2.5 rounded-xl border border-slate-200/80">
                          &ldquo;{src.snippet}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
