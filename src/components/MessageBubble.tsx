"use client";

import React from "react";
import { ChatMessage } from "@/types/chat";
import { AnswerCard } from "./AnswerCard";
import { User, Sparkles } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col gap-1.5 w-full ${isUser ? "items-end" : "items-start"}`}>
      {/* Header người gửi */}
      <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-slate-500">
        {isUser ? (
          <>
            <span>Em</span>
            <User className="w-3.5 h-3.5 text-slate-400" />
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-700">Gia sư AI Toán 8</span>
          </>
        )}
      </div>

      {isUser ? (
        /* User Message Bubble */
        <div className="max-w-[90%] md:max-w-[720px] rounded-2xl p-4 leading-relaxed break-words shadow-sm bg-blue-600 text-white rounded-tr-xs shadow-blue-500/10">
          {message.imageUrl && (
            <div className="mb-3 overflow-hidden rounded-xl border border-white/20 max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={message.imageUrl} alt="Ảnh bài toán" className="w-full object-contain max-h-64" />
            </div>
          )}
          <div className="whitespace-pre-wrap font-medium text-[15px]">{message.content}</div>
        </div>
      ) : (
        /* Assistant Structured Answer Card */
        <div className="w-full max-w-full md:max-w-[820px]">
          <AnswerCard content={message.content} sources={message.sources} />
        </div>
      )}
    </div>
  );
};
