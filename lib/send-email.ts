import nodemailer from "nodemailer";

interface DvarToraEmail {
  title: string;
  teaser: string;
  content: string;
  category: string;
  sourceVideoTitle?: string;
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
        <div style="white-space:pre-wrap;line-height:1.7">${d.content}</div>
        <p style="color:#999;font-size:12px;margin-top:16px">קטגוריה: ${d.category}${d.sourceVideoTitle ? ` | מקור: ${d.sourceVideoTitle}` : ""}</p>
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
