import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

// Middleware already validated the session before this runs.
// Defense-in-depth: re-check inline.
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  return NextResponse.json({ ok: true });
}
