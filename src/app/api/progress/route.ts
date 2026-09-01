import { NextRequest, NextResponse } from "next/server";

interface StudentMistakeRecord {
  id: string;
  topicName: string;
  mistakeType: string;
  advice: string;
  count: number;
}

interface StudentLearningProgressData {
  answered: number;
  correct: number;
  percent: number;
  label: string;
  topics: {
    id: string;
    name: string;
    total: number;
    correct: number;
    percent: number;
    domain: string;
  }[];
  mistakes: StudentMistakeRecord[];
  history: {
    id: string;
    topic_id: string;
    question: string;
    result: string;
    is_correct: boolean;
    difficulty: "easy" | "medium" | "hard";
    created_at: string;
  }[];
}

const inMemoryProgressData: StudentLearningProgressData = {
  answered: 16,
  correct: 14,
  percent: 88,
  label: "14/16 câu đúng · Đang ôn tập Chương 2 & Chương 4",
  topics: [
    { id: "don-thuc-da-thuc", name: "Đơn thức & Đa thức", total: 4, correct: 4, percent: 100, domain: "Đại số" },
    { id: "hang-dang-thuc", name: "7 Hằng đẳng thức đáng nhớ", total: 5, correct: 4, percent: 80, domain: "Đại số" },
    { id: "phan-tich-da-thuc-thanh-nhan-tu", name: "Phân tích đa thức thành nhân tử", total: 3, correct: 2, percent: 67, domain: "Đại số" },
    { id: "tu-giac", name: "Tứ giác & Hình thang cân", total: 2, correct: 2, percent: 100, domain: "Hình học" },
    { id: "dinh-ly-thales", name: "Định lý Thalès trong tam giác", total: 2, correct: 2, percent: 100, domain: "Hình học" },
  ],
  mistakes: [
    {
      id: "m1",
      topicName: "Hằng đẳng thức",
      mistakeType: "Nhầm lẫn dấu trong (A - B)^2 và A^2 - B^2",
      advice: "Chú ý: (A - B)^2 = A^2 - 2AB + B^2, còn A^2 - B^2 = (A - B)(A + B).",
      count: 1,
    },
    {
      id: "m2",
      topicName: "Phân tích đa thức",
      mistakeType: "Quên đổi dấu khi nhóm hạng tử có dấu trừ đằng trước",
      advice: "Khi đặt dấu '-' trước ngoặc: - (A - B) = - A + B.",
      count: 1,
    },
  ],
  history: [],
};

export async function GET(req: NextRequest) {
  return NextResponse.json(inMemoryProgressData);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic_id, question, result, mistakes, is_correct, difficulty = "medium" } = body;

    inMemoryProgressData.answered += 1;
    if (is_correct) {
      inMemoryProgressData.correct += 1;
    }

    inMemoryProgressData.percent = Math.round(
      (inMemoryProgressData.correct / inMemoryProgressData.answered) * 100
    );
    inMemoryProgressData.label = `${inMemoryProgressData.correct}/${inMemoryProgressData.answered} câu đúng`;

    if (topic_id) {
      const existingTopic = inMemoryProgressData.topics.find((t) => t.id === topic_id);
      if (existingTopic) {
        existingTopic.total += 1;
        if (is_correct) existingTopic.correct += 1;
        existingTopic.percent = Math.round((existingTopic.correct / existingTopic.total) * 100);
      }
    }

    if (mistakes && Array.isArray(mistakes)) {
      for (const m of mistakes) {
        const existingMistake = inMemoryProgressData.mistakes.find((item) => item.mistakeType === m);
        if (existingMistake) {
          existingMistake.count += 1;
        } else {
          inMemoryProgressData.mistakes.push({
            id: `m_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            topicName: topic_id || "Toán 8",
            mistakeType: m,
            advice: "Hãy ôn lại quy tắc và kiểm tra cẩn thận từng bước giải.",
            count: 1,
          });
        }
      }
    }

    if (question && result) {
      inMemoryProgressData.history.unshift({
        id: `h_${Date.now()}`,
        topic_id: topic_id || "toan-8",
        question,
        result,
        is_correct: Boolean(is_correct),
        difficulty,
        created_at: new Date().toISOString(),
      });

      if (inMemoryProgressData.history.length > 50) {
        inMemoryProgressData.history.pop();
      }
    }

    return NextResponse.json(inMemoryProgressData);
  } catch {
    return NextResponse.json(inMemoryProgressData);
  }
}
