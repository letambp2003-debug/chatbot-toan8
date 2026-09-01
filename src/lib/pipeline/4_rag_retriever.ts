import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "@/lib/ai/config";
import { KnowledgeChunk, BookSet, SourceType } from "@/types/knowledge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QueryRouterResult } from "./3_query_router";

export interface RAGRetrieverOptions {
  question: string;
  bookSet: BookSet;
  chapter?: string;
  topicId?: string;
  routerResult: QueryRouterResult;
  aiClient: GoogleGenAI;
}

async function generateQueryEmbedding(aiClient: GoogleGenAI, text: string): Promise<number[] | null> {
  try {
    const response = await aiClient.models.embedContent({
      model: AI_CONFIG.embeddingModel,
      contents: text,
    });

    const values = response.embeddings?.[0]?.values || (response as any).embedding?.values;
    if (Array.isArray(values) && values.length > 0) {
      return values;
    }
    return null;
  } catch (error) {
    console.error("Embedding generation error:", error);
    return null;
  }
}

function rerankChunks(
  chunks: KnowledgeChunk[],
  prioritySources: SourceType[],
  topicId?: string,
  topLimit: number = 5
): KnowledgeChunk[] {
  const scored = chunks.map((chunk) => {
    let boost = 0;

    const sourceIndex = prioritySources.indexOf(chunk.source_type);
    if (sourceIndex === 0) boost += 0.15;
    else if (sourceIndex === 1) boost += 0.08;

    if (topicId && chunk.topic_id === topicId) {
      boost += 0.2;
    }

    if (chunk.source_type === "SGK" && chunk.content_type === "knowledge") {
      boost += 0.05;
    }

    const finalScore = (chunk.similarity || 0.6) + boost;
    return { chunk, score: finalScore };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topLimit).map((item) => item.chunk);
}

export async function runRAGRetriever(options: RAGRetrieverOptions): Promise<KnowledgeChunk[]> {
  const { question, bookSet, chapter, topicId, routerResult, aiClient } = options;

  let candidates: KnowledgeChunk[] = [];

  try {
    const queryEmbedding = await generateQueryEmbedding(aiClient, question);

    if (queryEmbedding && queryEmbedding.length > 0) {
      const supabase = createServerSupabaseClient();
      const chapterNum = chapter ? parseInt(chapter, 10) : null;

      const { data, error } = await supabase.rpc("match_knowledge_chunks", {
        query_embedding: queryEmbedding,
        match_threshold: 0.35,
        match_count: AI_CONFIG.ragTopKInitial,
        filter_grade: 8,
        filter_book_set: bookSet,
        filter_chapter: isNaN(chapterNum as any) ? null : chapterNum,
        filter_topic_id: topicId || null,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        candidates = data as KnowledgeChunk[];
      }
    }
  } catch (error) {
    console.error("Supabase RAG query error, using fallback matching:", error);
  }

  if (candidates.length === 0) {
    candidates = getBuiltInKnowledgeChunks(topicId, bookSet);
  }

  return rerankChunks(candidates, routerResult.prioritySources, topicId, AI_CONFIG.ragTopKFinal);
}

function getBuiltInKnowledgeChunks(
  topicId?: string,
  bookSet: BookSet = "KNTT"
): KnowledgeChunk[] {
  const allBuiltIn: KnowledgeChunk[] = [
    {
      id: "SGK_T8_T1_CH01_B01_P008",
      source_type: "SGK",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume: 1,
      chapter: 1,
      lesson: 1,
      page: 8,
      topic_id: "don-thuc-da-thuc",
      content_type: "knowledge",
      content:
        "Đơn thức là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến. Đơn thức thu gọn là đơn thức chỉ gồm tích của một số với các biến mà mỗi biến đã được nâng lên lũy thừa với số mũ nguyên dương. Bậc của đơn thức có hệ số khác 0 là tổng số mũ của tất cả các biến có trong đơn thức đó.",
      approved: true,
      similarity: 0.88,
    },
    {
      id: "SGK_T8_T1_CH02_B03_P038",
      source_type: "SGK",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume: 1,
      chapter: 2,
      lesson: 3,
      page: 38,
      topic_id: "hang-dang-thuc",
      content_type: "knowledge",
      content:
        "7 Hằng đẳng thức đáng nhớ:\n1) Bình phương của một tổng: (A + B)^2 = A^2 + 2AB + B^2\n2) Bình phương của một hiệu: (A - B)^2 = A^2 - 2AB + B^2\n3) Hiệu hai bình phương: A^2 - B^2 = (A - B)(A + B)\n4) Lập phương của một tổng: (A + B)^3 = A^3 + 3A^2B + 3AB^2 + B^3\n5) Lập phương của một hiệu: (A - B)^3 = A^3 - 3A^2B + 3AB^2 - B^3\n6) Tổng hai lập phương: A^3 + B^3 = (A + B)(A^2 - AB + B^2)\n7) Hiệu hai lập phương: A^3 - B^3 = (A - B)(A^2 + AB + B^2)",
      approved: true,
      similarity: 0.95,
    },
    {
      id: "SBT_T8_T1_CH02_B03_P022",
      source_type: "SBT",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume: 1,
      chapter: 2,
      lesson: 3,
      page: 22,
      exercise_id: "2.12",
      topic_id: "hang-dang-thuc",
      content_type: "exercise",
      content:
        "Dạng bài: Khai triển hoặc viết biểu thức dưới dạng tích. Ví dụ: Tính nhanh 101^2 = (100 + 1)^2 = 100^2 + 2*100*1 + 1^2 = 10000 + 200 + 1 = 10201. Phân tích x^2 - 9 = (x - 3)(x + 3).",
      has_answer: true,
      approved: true,
      similarity: 0.9,
    },
    {
      id: "SGK_T8_T1_CH02_B04_P045",
      source_type: "SGK",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume: 1,
      chapter: 2,
      lesson: 4,
      page: 45,
      topic_id: "phan-tich-da-thuc-thanh-nhan-tu",
      content_type: "knowledge",
      content:
        "Các phương pháp phân tích đa thức thành nhân tử:\n1. Phương pháp đặt nhân tử chung: A.B + A.C = A(B + C).\n2. Phương pháp dùng hằng đẳng thức: Nhận diện biểu thức khớp với 1 trong 7 hằng đẳng thức.\n3. Phương pháp nhóm hạng tử: Nhóm các hạng tử có nhân tử chung hoặc tạo thành hằng đẳng thức.\n4. Phối hợp nhiều phương pháp.",
      approved: true,
      similarity: 0.92,
    },
    {
      id: "SGK_T8_T1_CH03_B01_P062",
      source_type: "SGK",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume: 1,
      chapter: 3,
      lesson: 1,
      page: 62,
      topic_id: "tu-giac",
      content_type: "knowledge",
      content:
        "Tứ giác ABCD là hình gồm bốn đoạn thẳng AB, BC, CD, DA trong đó bất kì hai đoạn thẳng nào cũng không cùng nằm trên một đường thẳng. Tổng các góc của một tứ giác bằng 360 độ: Góc A + Góc B + Góc C + Góc D = 360 độ.",
      approved: true,
      similarity: 0.89,
    },
    {
      id: "SGK_T8_T2_CH04_B01_P052",
      source_type: "SGK",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume: 2,
      chapter: 4,
      lesson: 1,
      page: 52,
      topic_id: "dinh-ly-thales",
      content_type: "knowledge",
      content:
        "Định lý Thales trong tam giác: Nếu một đường thẳng song song với một cạnh của tam giác và cắt hai cạnh còn lại thì nó định ra trên hai cạnh đó những đoạn thẳng tương ứng tỉ lệ. Nếu tam giác ABC có DE // BC (D thuộc AB, E thuộc AC) thì AD/AB = AE/AC hoặc AD/DB = AE/EC.",
      approved: true,
      similarity: 0.93,
    },
    {
      id: "SGK_T8_T2_CH04_B03_P070",
      source_type: "SGK",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume: 2,
      chapter: 4,
      lesson: 3,
      page: 70,
      topic_id: "tam-giac-dong-dang",
      content_type: "knowledge",
      content:
        "Hai tam giác đồng dạng: Tam giác A'B'C' gọi là đồng dạng với tam giác ABC nếu: Góc A'=A, B'=B, C'=C và A'B'/AB = B'C'/BC = C'A'/CA = k (tỉ số đồng dạng).\nCác trường hợp đồng dạng:\n1. Cạnh - cạnh - cạnh (c-c-c): 3 cặp cạnh tương ứng tỉ lệ.\n2. Cạnh - góc - cạnh (c-g-c): 2 cặp cạnh tương ứng tỉ lệ và góc xen giữa bằng nhau.\n3. Góc - góc (g-g): 2 cặp góc tương ứng bằng nhau.",
      approved: true,
      similarity: 0.94,
    },
    {
      id: "SGK_T8_T2_CH05_B01_P015",
      source_type: "SGK",
      grade: 8,
      subject: "Toán",
      book_set: bookSet,
      volume: 2,
      chapter: 5,
      lesson: 1,
      page: 15,
      topic_id: "phuong-trinh-bac-nhat",
      content_type: "knowledge",
      content:
        "Phương trình bậc nhất một ẩn là phương trình có dạng ax + b = 0 với a, b là hai số đã cho và a khác 0. Cách giải: Chuyển hạng tử b sang vế phải ax = -b, chia hai vế cho a ta được x = -b/a. Tập nghiệm S = {-b/a}.",
      approved: true,
      similarity: 0.91,
    },
  ];

  if (topicId) {
    const matched = allBuiltIn.filter((c) => c.topic_id === topicId);
    if (matched.length > 0) return matched;
  }

  return allBuiltIn;
}
