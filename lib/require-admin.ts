import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";

// Defense-in-depth: middleware (proxy.ts) already protects /api/admin/**,
// אבל כל route בודק שוב למקרה ש-matcher יישבר/יעקף.
export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !(await verifyAdminSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
