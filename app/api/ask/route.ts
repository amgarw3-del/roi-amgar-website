import { NextRequest, NextResponse } from "next/server";

// Rate limiting in-memory (לעדכן ל-Upstash Redis בפרויקשן)
const ipRequests = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;        // מקסימום שאלות
const RATE_WINDOW = 60 * 60; // לשעה (בשניות)

function checkRateLimit(ip: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const entry = ipRequests.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function sanitize(str: string): string {
  return str.trim().replace(/<[^>]*>/g, "").slice(0, 2000);
}

export async function POST(req: NextRequest) {
  // IP Rate limiting
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "שלחת יותר מדי שאלות. נסה שוב מאוחר יותר." },
      { status: 429 }
    );
  }

  // Cloudflare Turnstile verification (אחרי שמגדירים)
  const turnstileToken = req.headers.get("cf-turnstile-response");
  if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: ip,
        }),
      }
    );
    const verifyData = await verifyRes.json() as { success: boolean };
    if (!verifyData.success) {
      return NextResponse.json({ error: "אימות נכשל. נסה שוב." }, { status: 400 });
    }
  }

  // Parse & validate
  let name: string, question: string, questionType: string;
  try {
    const formData = await req.formData();
    name = sanitize(formData.get("name")?.toString() ?? "אנונימי");
    question = sanitize(formData.get("question")?.toString() ?? "");
    questionType = sanitize(formData.get("questionType")?.toString() ?? "general");
  } catch {
    return NextResponse.redirect(new URL("/shaal?error=invalid", req.url));
  }

  if (question.length < 10) {
    return NextResponse.redirect(new URL("/shaal?error=short", req.url));
  }

  // Spam detection: reject if contains URLs
  if (/https?:\/\//.test(question)) {
    return NextResponse.redirect(new URL("/shaal?error=spam", req.url));
  }

  // TODO: שליחה למייל עם nodemailer
  // await sendQuestionEmail({ name, question, questionType });
  console.log(`[שאל את הרב] IP:${ip} | Type:${questionType} | Name:${name}`);
  console.log(`Question: ${question.slice(0, 100)}...`);

  // Redirect to success
  return NextResponse.redirect(new URL("/shaal?sent=1", req.url));
}

// בלק CSRF-style: רק POST מהאתר עצמו
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
