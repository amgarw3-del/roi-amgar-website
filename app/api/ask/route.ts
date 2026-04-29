import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { sendQuestionNotification } from "@/lib/send-email";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const ipRequests = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60 * 60;

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

function redirect(req: NextRequest, target: string) {
  // 303 forces the browser to GET after a POST — without this, Next.js page routes return 405.
  return NextResponse.redirect(new URL(target, req.url), { status: 303 });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return redirect(req, "/shaal?error=rate");
  }

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
    const verifyData = (await verifyRes.json()) as { success: boolean };
    if (!verifyData.success) return redirect(req, "/shaal?error=invalid");
  }

  let name: string, question: string, questionType: string;
  try {
    const formData = await req.formData();
    name = sanitize(formData.get("name")?.toString() ?? "");
    question = sanitize(formData.get("question")?.toString() ?? "");
    questionType = sanitize(formData.get("questionType")?.toString() ?? "general");
  } catch {
    return redirect(req, "/shaal?error=invalid");
  }

  if (question.length < 10) return redirect(req, "/shaal?error=short");
  if (/https?:\/\//.test(question)) return redirect(req, "/shaal?error=spam");

  try {
    await sanity.create({
      _type: "qna",
      question,
      askerName: name || "אנונימי",
      questionType,
      isPublic: false,
    });
  } catch (err) {
    console.error("[ask] Sanity create failed:", err);
    return redirect(req, "/shaal?error=server");
  }

  // Email is best-effort — don't block the user if it fails.
  sendQuestionNotification({ name: name || "אנונימי", question, questionType }).catch(
    (err) => console.error("[ask] email failed:", err)
  );

  return redirect(req, "/shaal?sent=1");
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
