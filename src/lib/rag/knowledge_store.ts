import type { KnowledgeChunk, BookSet } from "../../types/knowledge.ts";

export const BUILTIN_GRADE8_KNOWLEDGE: KnowledgeChunk[] = [
  // =========================================================================
  // CHƯƠNG 1: ĐA THỨC (Tập 1 - Trang 5 đến 28)
  // =========================================================================
  {
    id: "SGK_T8_V1_CH01_L01_P008",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 1,
    lesson: 1,
    page: 8,
    topic_id: "don-thuc-da-thuc",
    content_type: "knowledge",
    content:
      "Đơn thức là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến. Đơn thức thu gọn là đơn thức chỉ gồm tích của một số với các biến mà mỗi biến đã được nâng lên lũy thừa với số mũ nguyên dương. Bậc của đơn thức có hệ số khác 0 là tổng số mũ của tất cả các biến có trong đơn thức đó.",
    approved: true,
    has_visual: false,
    similarity: 0.92,
  },
  {
    id: "SBT_T8_V1_CH01_EX_1_5_P012",
    source_type: "SBT",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 1,
    lesson: 1,
    page: 12,
    exercise_id: "1.5",
    topic_id: "don-thuc-da-thuc",
    content_type: "exercise",
    content:
      "Bài 1.5 (Trang 12 SBT Toán 8 Tập 1): Thu gọn và tìm bậc của các đơn thức sau:\na) A = 2x^2y * 3xy^3 = 6x^3y^4 (Bậc 7)\nb) B = -1/2 x^3y * 4x^2y^2 = -2x^5y^3 (Bậc 8).",
    has_answer: true,
    approved: true,
    has_visual: false,
    similarity: 0.95,
  },
  {
    id: "SGK_T8_V1_CH01_L03_P017",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 1,
    lesson: 3,
    page: 17,
    topic_id: "don-thuc-da-thuc",
    content_type: "knowledge",
    content:
      "Phép cộng và trừ đa thức: Muốn cộng hay trừ hai đa thức, ta thực hiện các bước sau:\n1. Bỏ dấu ngoặc (chú ý đổi dấu nếu trước ngoặc có dấu trừ).\n2. Nhóm các hạng tử đồng dạng lại với nhau.\n3. Cộng, trừ các đơn thức đồng dạng trong từng nhóm.",
    approved: true,
    has_visual: false,
    similarity: 0.90,
  },

  // =========================================================================
  // CHƯƠNG 2: HẰNG ĐẲNG THỨC ĐÁNG NHỚ VÀ ỨNG DỤNG (Tập 1 - Trang 29 đến 50)
  // =========================================================================
  {
    id: "SGK_T8_V1_CH02_L06_P033",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 2,
    lesson: 6,
    page: 33,
    topic_id: "hang-dang-thuc",
    content_type: "knowledge",
    content:
      "7 Hằng đẳng thức đáng nhớ:\n1. Bình phương của một tổng: (A + B)^2 = A^2 + 2AB + B^2\n2. Bình phương của một hiệu: (A - B)^2 = A^2 - 2AB + B^2\n3. Hiệu hai bình phương: A^2 - B^2 = (A - B)(A + B)\n4. Lập phương của một tổng: (A + B)^3 = A^3 + 3A^2B + 3AB^2 + B^3\n5. Lập phương của một hiệu: (A - B)^3 = A^3 - 3A^2B + 3AB^2 - B^3\n6. Tổng hai lập phương: A^3 + B^3 = (A + B)(A^2 - AB + B^2)\n7. Hiệu hai lập phương: A^3 - B^3 = (A - B)(A^2 + AB + B^2)",
    approved: true,
    has_visual: false,
    similarity: 0.96,
  },
  {
    id: "SBT_T8_V1_CH02_EX_2_14_P025",
    source_type: "SBT",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 2,
    lesson: 6,
    page: 25,
    exercise_id: "2.14",
    topic_id: "hang-dang-thuc",
    content_type: "exercise",
    content:
      "Bài 2.14 (Trang 25 SBT Toán 8 Tập 1): Khai triển hoặc thu gọn các biểu thức:\na) (2x + 3y)^2 = 4x^2 + 12xy + 9y^2\nb) (3x - 1)^2 = 9x^2 - 6x + 1\nc) (x - 2y)(x + 2y) = x^2 - 4y^2.",
    has_answer: true,
    approved: true,
    has_visual: false,
    similarity: 0.95,
  },
  {
    id: "SGK_T8_V1_CH02_L09_P045",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 2,
    lesson: 9,
    page: 45,
    topic_id: "phan-tich-da-thuc-thanh-nhan-tu",
    content_type: "knowledge",
    content:
      "Các phương pháp phân tích đa thức thành nhân tử:\n1. Đặt nhân tử chung: A.B + A.C = A(B + C).\n2. Dùng hằng đẳng thức đáng nhớ.\n3. Nhóm các hạng tử có nhân tử chung hoặc tạo thành hằng đẳng thức.\n4. Phối hợp nhiều phương pháp.",
    approved: true,
    has_visual: false,
    similarity: 0.93,
  },

  // =========================================================================
  // CHƯƠNG 3: TỨ GIÁC (Tập 1 - Trang 51 đến 78)
  // =========================================================================
  {
    id: "SGK_T8_V1_CH03_L10_P053",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 3,
    lesson: 10,
    page: 53,
    topic_id: "tu-giac",
    content_type: "knowledge",
    content:
      "Tứ giác ABCD là hình gồm bốn đoạn thẳng AB, BC, CD, DA trong đó bất kì hai đoạn thẳng nào cũng không cùng nằm trên một đường thẳng. Định lý: Tổng các góc trong một tứ giác bằng 360 độ (Góc A + Góc B + Góc C + Góc D = 360 độ).",
    approved: true,
    has_visual: true,
    similarity: 0.94,
  },
  {
    id: "SGK_T8_V1_CH03_L11_P057",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 3,
    lesson: 11,
    page: 57,
    topic_id: "hinh-thang-can",
    content_type: "knowledge",
    content:
      "Hình thang cân là hình thang có hai góc kề một đáy bằng nhau. Tính chất:\n1. Hai cạnh bên bằng nhau.\n2. Hai đường chéo bằng nhau.\nDấu hiệu nhận biết: Hình thang có hai góc kề một đáy bằng nhau hoặc hình thang có hai đường chéo bằng nhau là hình thang cân.",
    approved: true,
    has_visual: true,
    similarity: 0.91,
  },
  {
    id: "SGK_T8_V1_CH03_L12_P063",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 3,
    lesson: 12,
    page: 63,
    topic_id: "hinh-binh-hanh-chu-nhat-thoi-vuong",
    content_type: "knowledge",
    content:
      "Hình bình hành là tứ giác có các cạnh đối song song. Tính chất: Các cạnh đối bằng nhau, các góc đối bằng nhau, hai đường chéo cắt nhau tại trung điểm của mỗi đường.",
    approved: true,
    has_visual: true,
    similarity: 0.90,
  },

  // =========================================================================
  // CHƯƠNG 4: ĐỊNH LÝ THALÈS (Tập 1 - Trang 79 đến 98)
  // =========================================================================
  {
    id: "SGK_T8_V1_CH04_L15_P082",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 4,
    lesson: 15,
    page: 82,
    topic_id: "dinh-ly-thales",
    content_type: "knowledge",
    content:
      "Định lý Thalès trong tam giác: Nếu một đường thẳng song song với một cạnh của tam giác và cắt hai cạnh còn lại thì nó định ra trên hai cạnh đó những đoạn thẳng tương ứng tỉ lệ. Nếu tam giác ABC có DE // BC (D thuộc AB, E thuộc AC) thì AD/AB = AE/AC và AD/DB = AE/EC.",
    approved: true,
    has_visual: true,
    similarity: 0.95,
  },
  {
    id: "SGK_T8_V1_CH04_L16_P088",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 4,
    lesson: 16,
    page: 88,
    topic_id: "dinh-ly-thales",
    content_type: "knowledge",
    content:
      "Đường trung bình của tam giác là đoạn thẳng nối trung điểm hai cạnh của tam giác. Định lý: Đường trung bình của tam giác thì song song với cạnh thứ ba và bằng một nửa cạnh đó (MN // BC và MN = 1/2 BC).",
    approved: true,
    has_visual: true,
    similarity: 0.92,
  },
  {
    id: "SBT_T8_V1_CH04_EX_4_2_P056",
    source_type: "SBT",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 4,
    lesson: 15,
    page: 56,
    exercise_id: "4.2",
    topic_id: "dinh-ly-thales",
    content_type: "exercise",
    content:
      "Bài 4.2 (Trang 56 SBT Toán 8 Tập 1): Cho tam giác ABC, điểm D thuộc cạnh AB, E thuộc cạnh AC sao cho DE // BC. Biết AD = 3cm, DB = 2cm, AE = 4.5cm. Tính độ dài đoạn thẳng EC.\nLời giải: Áp dụng định lý Thales: AD/DB = AE/EC => 3/2 = 4.5/EC => EC = (2 * 4.5) / 3 = 3 cm.",
    has_answer: true,
    approved: true,
    has_visual: true,
    similarity: 0.96,
  },

  // =========================================================================
  // CHƯƠNG 5: DỮ LIỆU VÀ BIỂU ĐỒ (Tập 1 - Trang 99 đến 126)
  // =========================================================================
  {
    id: "SGK_T8_V1_CH05_L18_P102",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 1,
    chapter: 5,
    lesson: 18,
    page: 102,
    topic_id: "thong-ke-va-xac-suat",
    content_type: "knowledge",
    content:
      "Dữ liệu và biểu đồ: Thu thập dữ liệu, phân loại dữ liệu (định tính, định lượng). Biểu diễn dữ liệu bằng biểu đồ hình quạt tròn (để thấy tỉ lệ phần trăm của từng phần tử so với tổng thể) và biểu đồ đoạn thẳng (để biểu diễn sự thay đổi của một đại lượng theo thời gian).",
    approved: true,
    has_visual: true,
    similarity: 0.89,
  },

  // =========================================================================
  // CHƯƠNG 6: PHÂN THỨC ĐẠI SỐ (Tập 2 - Trang 5 đến 34)
  // =========================================================================
  {
    id: "SGK_T8_V2_CH06_L21_P008",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 2,
    chapter: 6,
    lesson: 21,
    page: 8,
    topic_id: "phan-thuc-dai-so",
    content_type: "knowledge",
    content:
      "Phân thức đại số là một biểu thức có dạng A/B, trong đó A, B là những đa thức và B khác đa thức 0. A gọi là tử thức, B gọi là mẫu thức. Tính chất cơ bản: A/B = (A.M)/(B.M) (với M khác 0) và A/B = (A:N)/(B:N) (với N là nhân tử chung của A và B).",
    approved: true,
    has_visual: false,
    similarity: 0.94,
  },
  {
    id: "SGK_T8_V2_CH06_L23_P022",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 2,
    chapter: 6,
    lesson: 23,
    page: 22,
    topic_id: "phan-thuc-dai-so",
    content_type: "knowledge",
    content:
      "Phép cộng và trừ phân thức đại số: Muốn cộng hoặc trừ hai phân thức cùng mẫu thức, ta cộng hoặc trừ các tử thức với nhau và giữ nguyên mẫu thức: A/M + B/M = (A + B)/M. Muốn cộng hoặc trừ hai phân thức khác mẫu thức, ta quy đồng mẫu thức rồi thực hiện phép tính.",
    approved: true,
    has_visual: false,
    similarity: 0.92,
  },

  // =========================================================================
  // CHƯƠNG 7: PHƯƠNG TRÌNH BẬC NHẤT VÀ HÀM SỐ BẬC NHẤT (Tập 2 - Trang 35 đến 73)
  // =========================================================================
  {
    id: "SGK_T8_V2_CH07_L25_P038",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 2,
    chapter: 7,
    lesson: 25,
    page: 38,
    topic_id: "phuong-trinh-bac-nhat",
    content_type: "knowledge",
    content:
      "Phương trình bậc nhất một ẩn có dạng ax + b = 0 (a khác 0). Cách giải: ax = -b => x = -b/a. Giải bài toán bằng cách lập phương trình: 1. Lập phương trình (chọn ẩn và đặt ĐK, biểu diễn các đại lượng chưa biết). 2. Giải phương trình. 3. Kiểm tra và kết luận.",
    approved: true,
    has_visual: false,
    similarity: 0.95,
  },
  {
    id: "SGK_T8_V2_CH07_L28_P060",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 2,
    chapter: 7,
    lesson: 28,
    page: 60,
    topic_id: "ham-so-bac-nhat",
    content_type: "knowledge",
    content:
      "Hàm số bậc nhất là hàm số được cho bởi công thức y = ax + b với a, b là các số cho trước và a khác 0. Hệ số a gọi là hệ số góc của đường thẳng y = ax + b. Đồ thị của hàm số y = ax + b là một đường thẳng cắt trục tung tại điểm (0; b) và cắt trục hoành tại (-b/a; 0).",
    approved: true,
    has_visual: true,
    similarity: 0.93,
  },

  // =========================================================================
  // CHƯƠNG 8: MỞ ĐẦU VỀ TÍNH XÁC SUẤT CỦA BIẾN CỐ (Tập 2 - Trang 74 đến 96)
  // =========================================================================
  {
    id: "SGK_T8_V2_CH08_L31_P083",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 2,
    chapter: 8,
    lesson: 31,
    page: 83,
    topic_id: "thong-ke-va-xac-suat",
    content_type: "knowledge",
    content:
      "Xác suất của biến cố trong trò chơi đồng khả năng: Giả thiết rằng các kết quả có thể của một hành động, thực nghiệm là đồng khả năng. Xác suất của biến cố E được tính bằng tỉ số giữa số kết quả thuận lợi cho E (k) và tổng số kết quả có thể (n): P(E) = k / n.",
    approved: true,
    has_visual: false,
    similarity: 0.91,
  },

  // =========================================================================
  // CHƯƠNG 9: TAM GIÁC ĐỒNG DẠNG (Tập 2 - Trang 97 đến 130)
  // =========================================================================
  {
    id: "SGK_T8_V2_CH09_L34_P108",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 2,
    chapter: 9,
    lesson: 34,
    page: 108,
    topic_id: "tam-giac-dong-dang",
    content_type: "knowledge",
    content:
      "Ba trường hợp đồng dạng của hai tam giác:\n1. Trường hợp 1 (Cạnh - Cạnh - Cạnh: c-c-c): Nếu 3 cạnh của tam giác này tỉ lệ với 3 cạnh của tam giác kia thì hai tam giác đồng dạng.\n2. Trường hợp 2 (Cạnh - Góc - Cạnh: c-g-c): Nếu 2 cạnh của tam giác này tỉ lệ với 2 cạnh của tam giác kia và 2 góc xen giữa bằng nhau thì hai tam giác đồng dạng.\n3. Trường hợp 3 (Góc - Góc: g-g): Nếu 2 góc của tam giác này lần lượt bằng 2 góc của tam giác kia thì hai tam giác đồng dạng.",
    approved: true,
    has_visual: true,
    similarity: 0.96,
  },

  // =========================================================================
  // CHƯƠNG 10: MỘT SỐ HÌNH KHỐI TRONG THỰC TIỄN (Tập 2 - Trang 131 đến 142)
  // =========================================================================
  {
    id: "SGK_T8_V2_CH10_L37_P133",
    source_type: "SGK",
    grade: 8,
    subject: "Toán",
    book_set: "KNTT",
    volume: 2,
    chapter: 10,
    lesson: 37,
    page: 133,
    topic_id: "hinh-khoi-trong-thuc-tien",
    content_type: "knowledge",
    content:
      "Hình chóp tam giác đều và hình chóp tứ giác đều:\n- Hình chóp tam giác đều có đáy là tam giác đều, các mặt bên là các tam giác cân bằng nhau chung đỉnh.\n- Diện tích xung quanh: Sxq = p * d (p là nửa chu vi đáy, d là trung đoạn - chiều cao mặt bên).\n- Thể tích: V = 1/3 * Sđáy * h (h là chiều cao hình chóp).",
    approved: true,
    has_visual: true,
    similarity: 0.94,
  },
];

export function queryBuiltInKnowledge(options: {
  topicId?: string;
  bookSet?: BookSet;
  chapter?: number;
  exerciseNumber?: string;
  pageNumber?: number;
}): KnowledgeChunk[] {
  const { topicId, chapter, exerciseNumber, pageNumber } = options;

  let results = BUILTIN_GRADE8_KNOWLEDGE.filter((c) => c.approved);

  if (exerciseNumber) {
    const exMatch = results.filter((c) => c.exercise_id === exerciseNumber);
    if (exMatch.length > 0) return exMatch;
  }

  if (pageNumber) {
    const pageMatch = results.filter((c) => c.page === pageNumber);
    if (pageMatch.length > 0) return pageMatch;
  }

  if (chapter) {
    const chapMatch = results.filter((c) => c.chapter === chapter);
    if (chapMatch.length > 0) return chapMatch;
  }

  if (topicId) {
    const topicMatch = results.filter((c) => c.topic_id === topicId);
    if (topicMatch.length > 0) return topicMatch;
  }

  return results;
}
