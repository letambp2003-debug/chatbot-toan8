"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/Topbar";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { Composer } from "@/components/Composer";
import { KeyModal } from "@/components/KeyModal";
import { ProgressModal } from "@/components/ProgressModal";
import { ChatMessage, LearningMode, LearningProgress } from "@/types/chat";
import { BookSet } from "@/types/knowledge";

export default function Home() {
  const [connected, setConnected] = useState(true);
  const [isCustomKey, setIsCustomKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentMode, setCurrentMode] = useState<LearningMode>("EXPLAIN");
  const [bookSet, setBookSet] = useState<BookSet>("KNTT");
  const [chapter, setChapter] = useState("");
  const [lesson, setLesson] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [progress, setProgress] = useState<LearningProgress>({
    answered: 16,
    correct: 14,
    percent: 88,
    label: "14/16 câu đúng · Đang ôn tập Chương 2 & Chương 4",
  });
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. Kiểm tra trạng thái phiên kết nối từ HttpOnly cookie / System Default Pool
  const checkStatus = async () => {
    try {
      const res = await fetch("/api/key/status");
      const data = await res.json();
      setConnected(Boolean(data.connected));
      setIsCustomKey(Boolean(data.isCustomKey));
    } catch (err) {
      console.error("Error checking session status:", err);
    }
  };

  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch("/api/progress");
        const data = await res.json();
        if (data) {
          setProgress(data);
        }
      } catch (err) {
        console.error("Error loading progress:", err);
      }
    }

    checkStatus();
    loadProgress();
  }, []);

  // 2. Xử lý gửi câu hỏi
  const handleSend = async (text: string, imageFile?: File | null) => {
    let imageUrl: string | undefined;
    if (imageFile) {
      imageUrl = URL.createObjectURL(imageFile);
    }

    const userMessageId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: text || "Gửi hình ảnh bài toán cần giải",
      imageUrl,
      mode: currentMode,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    try {
      const formData = new FormData();
      formData.append("question", text);
      formData.append("mode", currentMode);
      formData.append("book_set", bookSet);
      formData.append("chapter", chapter);
      if (lesson) formData.append("lesson", lesson);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.status === 401) {
        setConnected(false);
        setIsCustomKey(false);
        setKeyModalOpen(true);
        const errAssistantMsg: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: "Phiên Google AI đã hết hạn hoặc không hợp lệ. Em có thể bấm Dùng Key Mặc Định hoặc kết nối lại API key nhé.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errAssistantMsg]);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Không thể nhận phản hồi từ hệ thống.");
      }

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.answer || "Mình chưa thể tìm ra câu trả lời chắc chắn cho bài toán này.",
        sources: data.sources || [],
        mode: currentMode,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Cập nhật tiến độ sau khi hoàn thành
      if (data.progress) {
        setProgress(data.progress);
      } else {
        const progRes = await fetch("/api/progress");
        const progData = await progRes.json();
        if (progData) setProgress(progData);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: `Đã có sự cố khi xử lý câu hỏi: ${err.message || "Vui lòng thử lại sau."}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setBusy(false);
    }
  };

  // 3. Xử lý ngắt kết nối key riêng -> chuyển về dùng key hệ thống mặc định
  const handleDisconnect = async () => {
    try {
      await fetch("/api/key", { method: "DELETE" });
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setIsCustomKey(false);
      setConnected(true);
      const noticeMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: "Đã chuyển về sử dụng Google AI Key mặc định của hệ thống do Quản trị viên cung cấp.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, noticeMsg]);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background antialiased overflow-hidden">
      {/* Topbar */}
      <Topbar
        connected={connected}
        isCustomKey={isCustomKey}
        onOpenKeyModal={() => setKeyModalOpen(true)}
        onDisconnect={handleDisconnect}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentMode={currentMode}
          onSelectMode={(m) => setCurrentMode(m)}
          bookSet={bookSet}
          onChangeBookSet={(b) => setBookSet(b)}
          chapter={chapter}
          onChangeChapter={(c) => setChapter(c)}
          lesson={lesson}
          onChangeLesson={(l) => setLesson(l)}
          progress={progress}
          onOpenProgressDashboard={() => setProgressModalOpen(true)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Chat Content */}
        <main className="flex flex-1 flex-col overflow-hidden min-w-0">
          <ChatArea
            messages={messages}
            busy={busy}
            currentMode={currentMode}
            onQuickPrompt={(prompt) => handleSend(prompt)}
          />

          <Composer
            onSend={handleSend}
            busy={busy}
            connected={connected}
            onOpenKeyModal={() => setKeyModalOpen(true)}
            currentMode={currentMode}
          />
        </main>
      </div>

      {/* Modal nhập API Key an toàn */}
      <KeyModal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        onConnected={() => {
          checkStatus();
          setConnected(true);
        }}
      />

      {/* Modal Dashboard Tiến độ & Phân tích lỗi */}
      <ProgressModal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        onSelectTopicPrompt={(prompt) => handleSend(prompt)}
      />
    </div>
  );
}
