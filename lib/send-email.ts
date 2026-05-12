import nodemailer from "nodemailer";
import { markdownToHtml } from "./markdown-utils";


export async function sendQuestionNotification(params: {
  name: string;
  question: string;
  phone?: string;
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFICATION_EMAIL || user;
  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

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
          ${params.phone ? `<p style="margin:0 0 16px"><strong>טלפון:</strong> ${params.phone}</p>` : ""}
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

/**
 * שליחת דבר תורה שבועי לרב כמייל מסוגנן (לפני שבת/חג/צום).
 * המייל מכיל: כותרת, טיזר, תמונה inline, קישור קצר, ניוזלטר, ברכה דינמית.
 * מטרה: הרב פותח את המייל בטלפון → מעתיק את הטקסט + שומר תמונה → שולח לקבוצות וואטסאפ.
 */
export interface WeeklyDivarEmail {
  title: string;
  teaser: string;
  shortLinkUrl: string;
  imageUrl?: string;
  newsletterUrl: string;
  greeting: string;
  eventName: string;
  hebrewDate: string;
  whatsappTextForCopy: string; // הטקסט המוכן להעתקה לוואטסאפ
}

export async function sendWeeklyDvarEmail(item: WeeklyDivarEmail) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFICATION_EMAIL || user;

  if (!user || !pass) {
    throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD not configured");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const imageBlock = item.imageUrl
    ? `<div style="text-align:center;margin:16px 0">
         <img src="${item.imageUrl}" alt="${item.eventName}"
              style="max-width:100%;width:480px;height:auto;border-radius:12px;display:inline-block"/>
       </div>`
    : "";

  // טקסט מוכן להעתקה (בקופסה מעוצבת שקל לבחור)
  const copyTextHtml = item.whatsappTextForCopy
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  await transporter.sendMail({
    from: `"אתר הרב רועי אמגר" <${user}>`,
    to,
    subject: `📜 דבר תורה ל-${item.eventName} (${item.hebrewDate}) — מוכן להפצה`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;direction:rtl;text-align:right;background:#fafaf7;padding:0">
        <div style="background:linear-gradient(135deg,#06415D 0%,#0a5a7e 100%);color:white;padding:24px;border-radius:12px 12px 0 0">
          <div style="font-size:13px;opacity:0.85;margin-bottom:4px">מוכן להפצה לוואטסאפ</div>
          <h1 style="margin:0;font-size:22px;font-weight:600">${item.eventName} — ${item.hebrewDate}</h1>
        </div>

        <div style="background:white;padding:24px;border-radius:0;border-right:1px solid #e8e8e2;border-left:1px solid #e8e8e2">
          <h2 style="color:#06415D;margin:0 0 8px;font-size:24px;font-weight:700">${item.title}</h2>
          <p style="color:#5a4a36;font-size:16px;line-height:1.7;margin:0 0 16px">${item.teaser.replace(/</g, "&lt;")}</p>
          ${imageBlock}
          <div style="margin:20px 0;padding:14px;background:#f5f2ea;border-radius:8px;border-right:4px solid #C8956A">
            <div style="font-size:13px;color:#7a6850;margin-bottom:6px">🔗 קישור לקריאה מלאה:</div>
            <a href="${item.shortLinkUrl}" style="color:#06415D;font-weight:600;text-decoration:none;word-break:break-all">${item.shortLinkUrl}</a>
          </div>
          <div style="text-align:center;padding:12px 0;color:#06415D;font-weight:600;font-size:18px">${item.greeting}</div>
          <div style="text-align:center;color:#5a4a36">— הרב רועי אמגר</div>
        </div>

        <div style="background:#06415D;color:#cbd9e0;padding:18px 24px;border-radius:0 0 12px 12px">
          <div style="font-size:14px;font-weight:600;color:white;margin-bottom:10px">📋 טקסט מוכן להעתקה לוואטסאפ:</div>
          <div style="background:#ffffff;color:#1a1a1a;padding:16px;border-radius:6px;font-family:'Segoe UI',Arial,sans-serif;white-space:pre-wrap;font-size:14px;line-height:1.7;direction:rtl;text-align:right;user-select:all">${copyTextHtml}</div>
          <div style="margin-top:14px;font-size:12px;opacity:0.85;text-align:center">
            💡 בטלפון: לחץ ארוך על הטקסט למעלה → "בחר הכל" → "העתק" → הדבק בוואטסאפ
          </div>
        </div>

        <div style="text-align:center;padding:14px;color:#999;font-size:12px">
          המייל נשלח אוטומטית מערכת אתר הרב רועי אמגר
        </div>
      </div>`,
  });
}

/** התראה במייל: לא נמצא דבר תורה לאירוע הקרוב */
export async function sendMissingDvarAlert(eventName: string, hebrewDate: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFICATION_EMAIL || user;
  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://website-seven-kappa-25.vercel.app";

  await transporter.sendMail({
    from: `"אתר הרב רועי אמגר" <${user}>`,
    to,
    subject: `⚠️ חסר דבר תורה ל-${eventName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;direction:rtl;text-align:right">
        <div style="background:#a83a2c;color:white;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:18px">⚠️ אין דבר תורה מתאים במאגר</h1>
        </div>
        <div style="padding:24px;background:#fff7f5">
          <p style="font-size:16px;line-height:1.7;margin:0 0 12px">
            בעוד ~30 שעות מתקיים: <strong>${eventName}</strong> (${hebrewDate})
          </p>
          <p style="font-size:14px;color:#5a4a36;margin:0 0 16px">
            אך לא נמצא דבר תורה רלוונטי במאגר האתר. מומלץ להעלות תוכן לפני האירוע.
          </p>
          <div style="text-align:center;margin-top:20px">
            <a href="${siteUrl}/admin/content/divrei-tora" style="background:#06415D;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
              פתח את ניהול דברי תורה →
            </a>
          </div>
        </div>
      </div>`,
  });
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
