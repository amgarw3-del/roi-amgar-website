import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, SESSION_COOKIE_NAME } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // public admin routes — no auth needed
  if (pathname === "/admin/login" || pathname === "/api/admin/auth") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = token ? await verifyAdminSession(token) : false;

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
