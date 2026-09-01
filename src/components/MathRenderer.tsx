"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Tự động chuyển đổi các biểu thức toán thô (chứa ^, *, fractions, equations) thành KaTeX chuẩn
 */
function autoFormatRawMath(text: string): string {
  // Biểu thức chứa dấu mũ (^), phép nhân (*), phân số hoặc phương trình
  return text.replace(
    /(?:[a-zA-Z]\s*=\s*)?[-+]?(?:\d+\/\d+|\d+)?[a-zA-Z]*(?:\^[0-9a-zA-Z]+)?(?:\s*[\*\+\-\/\=]\s*[-+]?(?:\d+\/\d+|\d+)?[a-zA-Z]*(?:\^[0-9a-zA-Z]+)?)+/g,
    (match) => {
      // Chỉ bọc nếu có ký hiệu toán rõ ràng (mũ ^, nhân *, chia /, bằng =)
      if (!match.includes("^") && !match.includes("*") && !match.includes("=")) {
        return match;
      }

      // Làm sạch công thức để nạp vào KaTeX
      const cleanFormula = match
        .trim()
        .replace(/\*/g, " \\cdot ")
        .replace(/(-?\d+)\/(\d+)/g, "\\frac{$1}{$2}");

      try {
        return katex.renderToString(cleanFormula, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return match;
      }
    }
  );
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = "" }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return "";

    try {
      const placeholders: { id: string; html: string }[] = [];
      let tokenCounter = 0;

      // 1. Khối Display Math: \[ ... \] hoặc $$ ... $$
      let processed = content.replace(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g, (_, eq1, eq2) => {
        const formula = (eq1 || eq2 || "").trim().replace(/\*/g, " \\cdot ");
        const tokenId = `___MATH_DISPLAY_${tokenCounter++}___`;
        try {
          const html = `<div class="katex-display-wrapper my-3 overflow-x-auto py-1 text-center">${katex.renderToString(
            formula,
            { displayMode: true, throwOnError: false }
          )}</div>`;
          placeholders.push({ id: tokenId, html });
          return tokenId;
        } catch {
          return `\\[${formula}\\]`;
        }
      });

      // 2. Khối Inline Math: \( ... \) hoặc $ ... $
      processed = processed.replace(/\\\(([\s\S]*?)\\\)|\$([^\$\n]+?)\$/g, (_, eq1, eq2) => {
        const formula = (eq1 || eq2 || "").trim().replace(/\*/g, " \\cdot ");
        const tokenId = `___MATH_INLINE_${tokenCounter++}___`;
        try {
          const html = katex.renderToString(formula, {
            displayMode: false,
            throwOnError: false,
          });
          placeholders.push({ id: tokenId, html });
          return tokenId;
        } catch {
          return `\\(${formula}\\)`;
        }
      });

      // 3. Tự động nhận diện công thức toán thô trong phần văn bản còn lại
      processed = autoFormatRawMath(processed);

      // 4. Xử lý các thẻ Markdown cơ bản (Bold, Italic, Header, List, Line break)
      processed = processed
        .replace(/^### (.*$)/gim, '<h3 class="font-bold text-base mt-3 mb-1 text-slate-900">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="font-black text-lg mt-4 mb-2 text-slate-900">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/^- (.*$)/gim, '<div class="flex items-start gap-1.5 my-1 ml-1"><span class="text-blue-500 font-bold shrink-0">•</span><span>$1</span></div>')
        .replace(/\n\n/g, '<div class="my-2"></div>')
        .replace(/\n/g, "<br />");

      // 5. Khôi phục lại các khối KaTeX đã render
      for (const p of placeholders) {
        processed = processed.replace(p.id, p.html);
      }

      return processed;
    } catch (e) {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`prose prose-slate max-w-none break-words leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
