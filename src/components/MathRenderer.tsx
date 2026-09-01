"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = "" }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return "";

    try {
      // 1. Thay thế display math: \[ ... \] hoặc $$ ... $$
      let formatted = content.replace(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g, (_, eq1, eq2) => {
        const formula = (eq1 || eq2 || "").trim();
        try {
          return `<div class="katex-display-wrapper my-3 overflow-x-auto py-1">${katex.renderToString(formula, {
            displayMode: true,
            throwOnError: false,
          })}</div>`;
        } catch {
          return `\\[${formula}\\]`;
        }
      });

      // 2. Thay thế inline math: \( ... \) hoặc $ ... $
      formatted = formatted.replace(/\\\(([\s\S]*?)\\\)|\$([^\$\n]+?)\$/g, (_, eq1, eq2) => {
        const formula = (eq1 || eq2 || "").trim();
        try {
          return katex.renderToString(formula, {
            displayMode: false,
            throwOnError: false,
          });
        } catch {
          return `\\(${formula}\\)`;
        }
      });

      return formatted;
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
