"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Compass,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
} from "lucide-react";

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopicPrompt?: (prompt: string) => void;
}

interface TopicMastery {
  id: string;
  name: string;
  total: number;
  correct: number;
  percent: number;
  domain: string;
}

interface MistakeItem {
  id: string;
  topicName: string;
  mistakeType: string;
  advice: string;
  count: number;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  onClose,
  onSelectTopicPrompt,
}) => {
  const [topicStats, setTopicStats] = useState<TopicMastery[]>([]);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(16);
  const [correctQuestions, setCorrectQuestions] = useState(13);

  useEffect(() => {
    // Tải dữ liệu tiến độ từ API hoặc khởi tạo dữ liệu mặc định chuẩn
    const loadProgress = async () => {
      try {
        const res = await fetch("/api/progress");
        if (res.ok) {
          const data = await res.json();
          if (data.topics) setTopicStats(data.topics);
          if (data.total) setTotalQuestions(data.total);
          if (data.correct) setCorrectQuestions(data.correct);
          if (data.mistakes) setMistakes(data.mistakes);
          return;
        }
      } catch {
        // Fallback
      }

      // Default mock tracking data
      setTopicStats([
        { id: "don-thuc-da-thuc", name: "Đơn thức & Đa thức", total: 4, correct: 4, percent: 100, domain: "Đại số" },
        { id: "hang-dang-thuc", name: "7 Hằng đẳng thức đáng nhớ", total: 5, correct: 4, percent: 80, domain: "Đại số" },
        { id: "phan-tich-da-thuc-thanh-nhan-tu", name: "Phân tích đa thức thành nhân tử", total: 3, correct: 2, percent: 67, domain: "Đại số" },
        { id: "tu-giac", name: "Tứ giác & Hình thang cân", total: 2, correct: 2, percent: 100, domain: "Hình học" },
        { id: "dinh-ly-thales", name: "Định lý Thalès trong tam giác", total: 2, correct: 1, percent: 50, domain: "Hình học" },
      ]);

      setMistakes([
        {
          id: "m1",
          topicName: "Hằng đẳng thức",
          mistakeType: "Nhầm lẫn dấu trong (A - B)^2 và A^2 - B^2",
          advice: "Chú ý: (A - B)^2 = A^2 - 2AB + B^2, còn A^2 - B^2 = (A - B)(A + B).",
          count: 2,
        },
        {
          id: "m2",
          topicName: "Định lý Thalès",
          mistakeType: "Lập sai tỉ số đoạn thẳng tương ứng tỉ lệ",
          advice: "Khi DE // BC, luôn nhớ: AD/AB = AE/AC hoặc AD/DB = AE/EC.",
          count: 1,
        },
      ]);
    };

    if (isOpen) {
      loadProgress();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const overallPercent = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

  // Tìm topic có điểm % thấp nhất để gợi ý bài tiếp theo
  const weakestTopic =
    topicStats.length > 0
      ? [...topicStats].sort((a, b) => a.percent - b.percent)[0]
      : { id: "dinh-ly-thales", name: "Định lý Thalès", percent: 50 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Bảng Theo Dõi Tiến Độ Học Tập</h2>
            <p className="text-xs text-slate-500">Thống kê năng lực và phân tích lỗi sai chuẩn chương trình Toán 8</p>
          </div>
        </div>

        {/* Thống kê Tổng quan (Overview Cards) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-4">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">Độ chính xác</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-900">{overallPercent}%</span>
              <span className="text-xs text-blue-600 font-semibold">({correctQuestions}/{totalQuestions} câu)</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-blue-200/70 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${overallPercent}%` }} />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/30 p-4">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Chủ đề hoàn thành</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-900">{topicStats.filter((t) => t.percent >= 80).length}</span>
              <span className="text-xs text-emerald-600 font-semibold">/ {topicStats.length} chủ đề</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Nắm vững kiến thức</span>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50/30 p-4">
            <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">Lỗi cần lưu ý</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-900">{mistakes.length}</span>
              <span className="text-xs text-rose-600 font-semibold">dạng lỗi</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-rose-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cần ôn tập thêm</span>
            </div>
          </div>
        </div>

        {/* Đề xuất bài học tiếp theo (Smart Next Lesson Recommendation) */}
        {weakestTopic && (
          <div className="mb-6 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-blue-50/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Đề xuất bài học tiếp theo</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Luyện tập nâng cao: {weakestTopic.name} (Hiện đạt {weakestTopic.percent}%)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Chủ đề này có tỉ lệ làm bài cần củng cố thêm. Thầy khuyên em làm 4 bài luyện tập để vững kiến thức nhé.
                </p>
              </div>

              {onSelectTopicPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectTopicPrompt(`Cho em 4 bài tập luyện tập về ${weakestTopic.name} từ dễ đến vừa để em ôn lại nhé.`);
                    onClose();
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
                >
                  <span>Luyện ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mức độ thành thạo theo từng Topic */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Mức độ nắm vững theo Chủ đề Toán 8</span>
          </h3>

          <div className="space-y-2.5">
            {topicStats.map((topic) => (
              <div key={topic.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {topic.domain}
                    </span>
                    <span>{topic.name}</span>
                  </div>
                  <span className={topic.percent >= 80 ? "text-emerald-600" : topic.percent >= 60 ? "text-amber-600" : "text-rose-600"}>
                    {topic.percent}% ({topic.correct}/{topic.total} đúng)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      topic.percent >= 80 ? "bg-emerald-500" : topic.percent >= 60 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${topic.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lỗi thường gặp và Lời khuyên */}
        {mistakes.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-rose-600" />
              <span>Phân tích lỗi thường gặp và Lời khuyên sửa lỗi</span>
            </h3>

            <div className="space-y-2.5">
              {mistakes.map((m) => (
                <div key={m.id} className="rounded-2xl border border-rose-200/70 bg-rose-50/30 p-3.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-rose-900 mb-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{m.mistakeType}</span>
                    </div>
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold shrink-0">
                      Gặp {m.count} lần
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5">
                    💡 <strong>Lời khuyên:</strong> {m.advice}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
