import { NextResponse } from "next/server";

// Middleware already validated the session before this runs
export async function GET() {
  return NextResponse.json({ ok: true });
}
