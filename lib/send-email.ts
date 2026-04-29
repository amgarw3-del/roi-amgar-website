import nodemailer from "nodemailer";
import { markdownToHtml } from "./markdown-utils";

const QUESTION_TYPE_HE: Record<string, string> = {
  general: "כללית (לצורך לימוד)",
  "practical-ruling": "למעשה",
  personal: "אישית (לא לפרסום)",
};

export async function sendQuestionNotification(params: {
  name: string;
  question: string;
  questionType: string;
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFICATION_EMAIL || user;
  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const typeLabel = QUESTION_TYPE_HE[params.questionType] ?? params.questionType;
  const adminUrl = "https://website-seven-kappa-25.vercel.app/admin/content/qna";

  await transporter.sendMail({
    from: `"אתר הרב רועי אמגר" <${user}>`,
    to,
    subject: `📩 שאלה חדשה ב"שאל את הרב" — ${params.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;direction:rtl;text-align:right">
        <div style="background:#06415D;color:white;padding:18px 22px;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:18px">📩 שאלה חדשה התקבלה</h1>
        </div>
        <div style="padding:22px;background:#f9f9f9;border-radius:0 0 8px 8px">
          <p style="margin:0 0 8px"><strong>שם השואל:</strong> ${params.name}</p>
          <p style="margin:0 0 16px"><strong>סוג:</strong> ${typeLabel}</p>
          <div style="background:white;border:1px solid #e5e5e5;border-radius:8px;padding:16px;line-height:1.7;white-space:pre-wrap">${params.question.replace(/</g, "&lt;")}</div>
          <div style="text-align:center;margin-top:24px">
            <a href="${adminUrl}"
               style="background:#06415D;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
              כתוב תשובה בדשבורד →
            </a>
          </div>
        </div>
      </div>`,
  });
}

export interface DvarToraEmail {
  title: string;
  teaser: string;
  content: string;
  category: string;
  sourceVideoTitle?: string;
  approveUrl?: string;
}

export async function sendDvarToraForApproval(items: DvarToraEmail[]) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFICATION_EMAIL || user;

  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const itemsHtml = items
    .map(
      (d, i) => `
      <div style="margin-bottom:32px;padding:20px;border:1px solid #ddd;border-radius:8px;direction:rtl">
        <h2 style="color:#06415D;margin-top:0">${i + 1}. ${d.title}</h2>
        <p style="color:#C8956A;font-style:italic">${d.teaser}</p>
        <hr style="border-color:#eee"/>
        <div style="line-height:1.7">${markdownToHtml(d.content)}</div>
        <p style="color:#999;font-size:12px;margin-top:16px">קטגוריה: ${d.category}${d.sourceVideoTitle ? ` | מקור: ${d.sourceVideoTitle}` : ""}</p>
        ${d.approveUrl ? `<div style="text-align:center;margin-top:12px">
          <a href="${d.approveUrl}" style="background:#2e7d32;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">
            ✅ פרסם עכשיו
          </a>
        </div>` : ""}
      </div>`
    )
    .join("");

  await transporter.sendMail({
    from: `"אתר הרב רועי אמגר" <${user}>`,
    to,
    subject: `✍️ ${items.length} דבר${items.length > 1 ? "י" : ""} תורה חד${items.length > 1 ? "שים" : "ש"} ממתינ${items.length > 1 ? "ים" : ""} לאישורך`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;direction:rtl">
        <div style="background:#06415D;color:white;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:20px">הרב רועי אמגר — דברי תורה חדשים</h1>
          <p style="margin:8px 0 0;opacity:0.8">נוצרו אוטומטית מתוך שיעורים חדשים — ממתינים לאישורך</p>
        </div>
        <div style="padding:20px;background:#f9f9f9">
          ${itemsHtml}
          <div style="text-align:center;margin-top:24px">
            <a href="https://bssgoew8.sanity.studio/structure/divarTora"
               style="background:#06415D;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
              פתח את הסטודיו לאישור ופרסום →
            </a>
          </div>
        </div>
      </div>`,
  });
}
