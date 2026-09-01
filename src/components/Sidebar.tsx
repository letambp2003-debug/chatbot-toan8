"use client";

import React from "react";
import {
  MessageSquare,
  Edit3,
  Lightbulb,
  BookOpen,
  CheckSquare,
  Search,
  BookMarked,
  Layers,
  BarChart2,
  BookCheck,
  ChevronRight,
} from "lucide-react";
import { LearningMode, LearningProgress } from "@/types/chat";
import { BookSet } from "@/types/knowledge";
import { TOAN8_KNTT_CURRICULUM } from "@/lib/knowledge/curriculum";

interface SidebarProps {
  currentMode: LearningMode;
  onSelectMode: (mode: LearningMode) => void;
  bookSet: BookSet;
  onChangeBookSet: (b: BookSet) => void;
  chapter: string;
  onChangeChapter: (c: string) => void;
  lesson?: string;
  onChangeLesson?: (l: string) => void;
  progress?: LearningProgress;
  onOpenProgressDashboard?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const MODES: { id: LearningMode; label: string; icon: React.ReactNode }[] = [
  { id: "EXPLAIN", label: "Hỏi bài", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "SOLVE", label: "Giải bài", icon: <Edit3 className="w-4 h-4" /> },
  { id: "HINT", label: "Gợi ý", icon: <Lightbulb className="w-4 h-4" /> },
  { id: "PRACTICE", label: "Luyện tập", icon: <BookOpen className="w-4 h-4" /> },
  { id: "QUIZ", label: "Trắc nghiệm", icon: <CheckSquare className="w-4 h-4" /> },
  { id: "CHECK_ANSWER", label: "Kiểm tra đáp án", icon: <Search className="w-4 h-4" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  bookSet,
  onChangeBookSet,
  chapter,
  onChangeChapter,
  lesson = "",
  onChangeLesson,
  progress,
  onOpenProgressDashboard,
  isOpen,
  onClose,
}) => {
  // Lọc danh sách các bài học thuộc chương đang chọn
  const selectedChapterNum = chapter ? parseInt(chapter, 10) : null;
  const filteredLessons = selectedChapterNum
    ? TOAN8_KNTT_CURRICULUM.filter((l) => l.chapter === selectedChapterNum)
    : [];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-72 border-r border-line bg-white p-4 transition-transform duration-200 lg:static lg:translate-x-0 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Chế độ học */}
        <div className="mb-5">
          <div className="mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
            Chế độ học (6 Modes)
          </div>
          <div className="space-y-1">
            {MODES.map((m) => {
              const active = currentMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectMode(m.id);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-blue-50 text-blue-700 shadow-xs border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.icon}
                  </div>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Phạm vi học: Bộ sách, Chương & Bài */}
        <div className="mb-5">
          <div className="mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
            Phạm vi chương trình
          </div>

          <div className="space-y-2.5">
            {/* Bộ sách */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5" />
                <span>Bộ sách</span>
              </label>
              <select
                value={bookSet}
                onChange={(e) => onChangeBookSet(e.target.value as BookSet)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none shadow-2xs"
              >
                <option value="KNTT">Kết nối tri thức</option>
                <option value="CTST">Chân trời sáng tạo</option>
                <option value="CD">Cánh Diều</option>
              </select>
            </div>

            {/* Chương */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Chương (1 - 10)</span>
              </label>
              <select
                value={chapter}
                onChange={(e) => {
                  onChangeChapter(e.target.value);
                  if (onChangeLesson) onChangeLesson("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none shadow-2xs"
              >
                <option value="">Tất cả các chương</option>
                <option value="1">Chương 1: Đa thức</option>
                <option value="2">Chương 2: Hằng đẳng thức & Phân tích</option>
                <option value="3">Chương 3: Tứ giác</option>
                <option value="4">Chương 4: Định lý Thalès</option>
                <option value="5">Chương 5: Dữ liệu & Biểu đồ</option>
                <option value="6">Chương 6: Phân thức đại số</option>
                <option value="7">Chương 7: Phương trình & Hàm số bậc nhất</option>
                <option value="8">Chương 8: Xác suất biến cố</option>
                <option value="9">Chương 9: Tam giác đồng dạng</option>
                <option value="10">Chương 10: Hình khối trong thực tiễn</option>
              </select>
            </div>

            {/* Bài học (Tự động cập nhật theo Chương) */}
            {filteredLessons.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                  <BookCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bài học</span>
                </label>
                <select
                  value={lesson}
                  onChange={(e) => onChangeLesson && onChangeLesson(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none shadow-2xs"
                >
                  <option value="">Tất cả các bài trong chương</option>
                  {filteredLessons.map((l) => (
                    <option key={l.lesson} value={String(l.lesson)}>
                      Bài {l.lesson}: {l.lessonTitle}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Tiến độ học tập & Mở Dashboard */}
        <div>
          <div className="mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Tiến độ học tập</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenProgressDashboard}
            className="w-full text-left rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/50 p-3.5 hover:border-blue-300 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Độ hoàn thành</span>
              <span className="text-blue-600 font-black">{progress?.percent || 85}%</span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden my-2">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(progress?.percent || 85, 0), 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60 text-[11px] font-semibold text-blue-600 group-hover:text-blue-700">
              <span>Xem Dashboard chi tiết</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
