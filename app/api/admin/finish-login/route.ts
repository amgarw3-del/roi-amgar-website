import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";

// נקודת קצה ל-OAuth cross-domain: מקבלת session token חתום מ-google-callback
// ומגדירה אותו כ-cookie על הדומיין הנוכחי (haravroiamgar.com למשל).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/admin/login", req.url);

  if (!token || !(await verifyAdminSession(token))) {
    loginUrl.searchParams.set("error", "invalid_token");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(new URL("/admin", req.url));
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
