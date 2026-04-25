import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, SESSION_COOKIE_NAME } from "@/lib/admin-auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // הגן על automation endpoints
  if (pathname.startsWith("/api/scan") || pathname.startsWith("/api/publish")) {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Admin protection — allow login + auth without cookie
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  ) {
    if (pathname === "/admin/login" || pathname === "/api/admin/auth") {
      return NextResponse.next();
    }
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const valid = token ? await verifyAdminSession(token) : false;
    if (!valid) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // בלוק בקשות חשודות ל-API
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (
      process.env.NODE_ENV === "production" &&
      origin &&
      host &&
      !origin.includes(host)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
