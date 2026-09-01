"use client";

import React from "react";
import { SourceCitation } from "@/types/knowledge";
import { BookOpen, Bookmark } from "lucide-react";

interface SourceCardProps {
  sources: SourceCitation[];
}

export const SourceCard: React.FC<SourceCardProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="w-full max-w-[780px] mt-3 overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 border-b border-line">
        <BookOpen className="w-4 h-4 text-blue-600" />
        <span>Nguồn tham khảo SGK / SBT</span>
      </div>

      <div className="divide-y divide-line text-xs text-slate-600">
        {sources.map((src, idx) => {
          const parts = [
            src.source_type ? `${src.source_type} Toán 8 (${src.book_set || "KNTT"})` : "Tài liệu Toán 8",
            src.volume ? `Tập ${src.volume}` : "",
            src.chapter ? `Chương ${src.chapter}` : "",
            src.lesson ? `Bài ${src.lesson}` : "",
            src.exercise_id ? `Bài tập ${src.exercise_id}` : "",
            src.page ? `Trang ${src.page}` : "",
          ].filter(Boolean);

          return (
            <div key={idx} className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 transition-colors">
              <Bookmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{parts.join(" · ") || "SGK/SBT Toán 8"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
