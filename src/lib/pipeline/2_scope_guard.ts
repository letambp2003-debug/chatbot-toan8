import { LearningMode, ScopeGuardResult } from "@/types/chat";

// Các từ khóa nhận diện nội dung ngoài phạm vi Toán 8
const OUT_OF_SCOPE_KEYWORDS = [
  "tích phân",
  "đạo hàm",
  "giới hạn lim",
  "lim ",
  "\\int",
  "\\frac{d}{dx}",
  "đại số tuyến tính",
  "ma trận",
  "vector không gian",
  "toán 12",
  "toán 11",
  "toán 10",
  "toán đại học",
  "số phức",
  "hình giải tích oxyz",
  "logarit",
  "lũy thừa vô tỉ",
  "chuỗi fourier",
  "vi phân",
  "phương trình vi phân",
];

// Bản đồ nhận diện Topic ID và Domain cho Toán 8
interface TopicRule {
  id: string;
  name: string;
  domain: "ALGEBRA" | "GEOMETRY" | "STATISTICS_PROBABILITY";
  keywords: string[];
}

const TOAN8_TOPICS: TopicRule[] = [
  {
    id: "don-thuc-da-thuc",
    name: "Đơn thức và đa thức",
    domain: "ALGEBRA",
    keywords: ["đơn thức", "đa thức", "bậc của đa thức", "thu gọn đa thức", "cộng trừ đa thức", "nhân đơn thức", "nhân đa thức"],
  },
  {
    id: "hang-dang-thuc",
    name: "Hằng đẳng thức đáng nhớ",
    domain: "ALGEBRA",
    keywords: ["hằng đẳng thức", "bình phương của một tổng", "bình phương của một hiệu", "hiệu hai bình phương", "lập phương", "tổng hai lập phương", "hiệu hai lập phương", "(a+b)^2", "(a-b)^2", "a^2-b^2", "(a+b)^3", "(a-b)^3", "a^3+b^3", "a^3-b^3"],
  },
  {
    id: "phan-tich-da-thuc-thanh-nhan-tu",
    name: "Phân tích đa thức thành nhân tử",
    domain: "ALGEBRA",
    keywords: ["phân tích đa thức thành nhân tử", "nhân tử chung", "nhóm hạng tử", "thành nhân tử", "tách hạng tử"],
  },
  {
    id: "phan-thuc-dai-so",
    name: "Phân thức đại số",
    domain: "ALGEBRA",
    keywords: ["phân thức", "điều kiện xác định", "đkxđ", "rút gọn phân thức", "quy đồng mẫu thức", "cộng phân thức", "trừ phân thức", "nhân phân thức", "chia phân thức"],
  },
  {
    id: "ham-so-bac-nhat",
    name: "Hàm số bậc nhất và đồ thị",
    domain: "ALGEBRA",
    keywords: ["hàm số", "hàm số bậc nhất", "y = ax + b", "đồ thị hàm số", "hệ số góc", "song song", "cắt nhau"],
  },
  {
    id: "phuong-trinh-bac-nhat",
    name: "Phương trình bậc nhất một ẩn",
    domain: "ALGEBRA",
    keywords: ["phương trình bậc nhất", "giải phương trình", "nghiệm của phương trình", "lập phương trình", "bài toán bằng cách lập phương trình", "quãng đường", "vận tốc", "năng suất"],
  },
  {
    id: "tu-giac",
    name: "Tứ giác",
    domain: "GEOMETRY",
    keywords: ["tứ giác", "tổng các góc của tứ giác", "hình tứ giác"],
  },
  {
    id: "hinh-thang-can",
    name: "Hình thang cân",
    domain: "GEOMETRY",
    keywords: ["hình thang", "hình thang cân", "dấu hiệu nhận biết hình thang cân"],
  },
  {
    id: "hinh-binh-hanh-chu-nhat-thoi-vuong",
    name: "Hình bình hành, hình chữ nhật, hình thoi, hình vuông",
    domain: "GEOMETRY",
    keywords: ["hình bình hành", "hình chữ nhật", "hình thoi", "hình vuông", "dấu hiệu nhận biết"],
  },
  {
    id: "dinh-ly-thales",
    name: "Định lý Thales trong tam giác",
    domain: "GEOMETRY",
    keywords: ["định lý thales", "thales", "ta-lét", "tỉ số đoạn thẳng", "định lý talet", "thales đảo"],
  },
  {
    id: "tam-giac-dong-dang",
    name: "Tam giác đồng dạng",
    domain: "GEOMETRY",
    keywords: ["tam giác đồng dạng", "đồng dạng", "trường hợp đồng dạng", "c-c-c", "c-g-c", "g-g", "tỉ số đồng dạng"],
  },
  {
    id: "hinh-khoi-trong-thuc-tien",
    name: "Hình khối trong thực tiễn (Hình chóp)",
    domain: "GEOMETRY",
    keywords: ["hình chóp tam giác đều", "hình chóp tứ giác đều", "diện tích xung quanh", "thể tích hình chóp"],
  },
  {
    id: "thong-ke-va-xac-suat",
    name: "Thu thập, biểu diễn dữ liệu và Xác suất",
    domain: "STATISTICS_PROBABILITY",
    keywords: ["biểu đồ", "thu thập dữ liệu", "bảng thống kê", "biểu đồ cột kép", "biểu đồ quạt tròn", "biểu đồ đoạn thẳng", "xác suất", "biến cố"],
  },
];

export function runScopeGuard(question: string, requestedMode: LearningMode): ScopeGuardResult {
  const lower = question.toLowerCase();

  // 1. Kiểm tra Out-of-scope nghiêm ngặt
  for (const oos of OUT_OF_SCOPE_KEYWORDS) {
    if (lower.includes(oos)) {
      return {
        decision: "OUT_OF_SCOPE",
        grade: 8,
        domain: "OTHER",
        intent: requestedMode,
        confidence: 0.99,
        reason: `Nội dung chứa từ khóa ngoài chương trình: "${oos}".`,
        sources_needed: [],
      };
    }
  }

  // 2. So khớp với các chủ đề Toán 8
  let matchedTopic: TopicRule | null = null;
  let highestMatchCount = 0;

  for (const topic of TOAN8_TOPICS) {
    let count = 0;
    for (const kw of topic.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        count++;
      }
    }
    if (count > highestMatchCount) {
      highestMatchCount = count;
      matchedTopic = topic;
    }
  }

  if (matchedTopic && highestMatchCount > 0) {
    return {
      decision: "IN_SCOPE",
      grade: 8,
      domain: matchedTopic.domain,
      topic_id: matchedTopic.id,
      intent: requestedMode,
      confidence: 0.95,
      sources_needed: ["SGK", "SBT", "KT_MD"],
    };
  }

  // 3. Nếu câu hỏi có biểu thức toán học hoặc từ ngữ liên quan đến giải toán lớp 8
  const mathSymbols = ["=", "+", "-", "*", "/", "x", "y", "a", "b", "cm", "cm2", "^2", "chứng minh", "tìm x", "tính"];
  const hasMathSymbol = mathSymbols.some((s) => lower.includes(s));

  if (hasMathSymbol) {
    return {
      decision: "IN_SCOPE",
      grade: 8,
      domain: "ALGEBRA",
      intent: requestedMode,
      confidence: 0.75,
      sources_needed: ["SGK", "SBT", "KT_MD"],
    };
  }

  // 4. Nếu không rõ ràng
  return {
    decision: "UNCERTAIN",
    grade: 8,
    domain: "OTHER",
    intent: requestedMode,
    confidence: 0.5,
    reason: "Câu hỏi chưa rõ ràng về phạm vi Toán 8.",
    sources_needed: ["SGK", "KT_MD"],
  };
}
