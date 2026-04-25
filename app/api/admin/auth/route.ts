import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, SESSION_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !password || password !== adminPassword) {
    return NextResponse.json({ error: "סיסמה שגויה" }, { status: 401 });
  }

  const token = await createAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
