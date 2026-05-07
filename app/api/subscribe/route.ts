import { NextRequest, NextResponse } from "next/server";

// In-memory rate-limit לפי IP — מתאפס בכל deploy של Vercel, אך מספיק לבלימת spam ידני.
const ipRequests = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_S = 60 * 60;

function checkRateLimit(ip: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const entry = ipRequests.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_WINDOW_S });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s+()\-]{6,30}$/;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "יותר מדי בקשות, נסה שוב בעוד שעה" }, { status: 429 });
  }

  let parsed: { name?: unknown; email?: unknown; phone?: unknown };
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
  const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
  const phone = typeof parsed.phone === "string" ? parsed.phone.trim() : "";

  if (!name || name.length > 100) {
    return NextResponse.json({ error: "שם חובה (עד 100 תווים)" }, { status: 400 });
  }
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "כתובת אימייל לא תקינה" }, { status: 400 });
  }
  if (phone && !PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "מספר טלפון לא תקין" }, { status: 400 });
  }

  try {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
    const token = process.env.SANITY_API_TOKEN!;

    const mutations = [{
      create: {
        _type: "subscriber",
        name,
        phone,
        email,
        createdAt: new Date().toISOString(),
      }
    }];

    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2021-06-07/data/mutate/${dataset}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutations }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Sanity error:", err);
      return NextResponse.json({ error: "שגיאה בשמירה" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
