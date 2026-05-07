import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import nodemailer from "nodemailer";
import { requireAdmin } from "@/lib/require-admin";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { subject, body, previewText } = await req.json() as {
    subject: string;
    body: string;
    previewText?: string;
  };

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "נושא ותוכן הם שדות חובה" }, { status: 400 });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    return NextResponse.json({ error: "הגדרות Gmail חסרות" }, { status: 500 });
  }

  const subscribers = await sanity.fetch<{ email: string; name?: string }[]>(
    `*[_type == "subscriber" && defined(email)] { email, name }`
  );

  if (subscribers.length === 0) {
    return NextResponse.json({ error: "אין מנויים" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const bodyHtml = body
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 16px;line-height:1.8">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5efe6;font-family:Arial,sans-serif">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden">${previewText}</div>` : ""}
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#06415D;padding:24px 28px;text-align:right">
      <h1 style="color:#fff;margin:0;font-size:20px">הרב רועי אמגר</h1>
      <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:14px">תורה לחיים</p>
    </div>
    <div style="padding:28px;direction:rtl;text-align:right;color:#1a1a2e;font-size:16px;line-height:1.8">
      ${bodyHtml}
    </div>
    <div style="background:#f5efe6;padding:16px 28px;text-align:center;font-size:12px;color:#999">
      <p style="margin:0">קיבלת מייל זה כי נרשמת לקבל עדכונים מהרב רועי אמגר.</p>
    </div>
  </div>
</body>
</html>`;

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      await transporter.sendMail({
        from: `"הרב רועי אמגר" <${gmailUser}>`,
        to: sub.email,
        subject,
        html,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: subscribers.length });
}
