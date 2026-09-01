import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/security/encryption";
import { logger } from "@/lib/security/logger";

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({
    connected: false,
    message: "Đã ngắt kết nối Google AI thành công.",
  });

  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  logger.info("Người dùng đã ngắt kết nối Google AI session.");
  return response;
}
