import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gia sư AI Toán 8 - Trợ lý học tập chuẩn SGK & SBT",
  description: "Chatbot ôn tập và giải bài tập Toán 8 dựa trên SGK, SBT và Google GenAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
