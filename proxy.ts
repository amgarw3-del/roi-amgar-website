import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // הגן על automation endpoints
  if (pathname.startsWith("/api/scan") || pathname.startsWith("/api/publish")) {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // בלוק בקשות חשודות ל-API
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    // רק בפרויקשן: אפשר רק origin מאותו דומיין
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
  matcher: ["/api/:path*"],
};
