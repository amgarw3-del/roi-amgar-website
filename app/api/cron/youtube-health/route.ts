import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CHANNEL_ID = "UCpep2f42VluYwMqZ4kXiQTA";

type CheckResult = {
  source: "api" | "rss" | "none";
  apiOk: boolean;
  rssOk: boolean;
  apiError: string | null;
  rssError: string | null;
  videosCount: number;
};

async function checkYouTubeAPI(): Promise<{ ok: boolean; error: string | null; count: number }> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { ok: false, error: "YOUTUBE_API_KEY not set", count: 0 };

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=date&maxResults=1&key=${key}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `${res.status}: ${body.slice(0, 150)}`, count: 0 };
    }
    const data = await res.json();
    const count = (data.items ?? []).length;
    if (count === 0) return { ok: false, error: "API returned 0 items", count: 0 };
    return { ok: true, error: null, count };
  } catch (e) {
    return { ok: false, error: (e as Error).message, count: 0 };
  }
}

async function checkRSS(): Promise<{ ok: boolean; error: string | null; count: number }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { ok: false, error: `RSS HTTP ${res.status}`, count: 0 };
    const xml = await res.text();
    const count = (xml.match(/<entry>/g) ?? []).length;
    if (count === 0) return { ok: false, error: "RSS returned 0 entries", count: 0 };
    return { ok: true, error: null, count };
  } catch (e) {
    return { ok: false, error: (e as Error).message, count: 0 };
  }
}

async function sendAlertEmail(result: CheckResult) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFICATION_EMAIL || user;
  if (!user || !pass) {
    console.warn("[health] GMAIL credentials missing — skipping email");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const isCritical = !result.apiOk && !result.rssOk;
  const subject = isCritical
    ? "🚨 קריטי: סנכרון יוטיוב נכשל לחלוטין באתר הרב"
    : "⚠️ אזהרה: סנכרון API של יוטיוב לא עובד באתר הרב";

  const statusBadge = isCritical
    ? '<span style="background:#dc2626;color:white;padding:4px 10px;border-radius:4px">קריטי</span>'
    : '<span style="background:#f59e0b;color:white;padding:4px 10px;border-radius:4px">אזהרה</span>';

  const explanation = isCritical
    ? `<p><strong>שני מקורות הנתונים נכשלו</strong> — האתר לא מציג סרטונים חדשים כרגע. נדרש טיפול מיידי.</p>`
    : `<p>ה-YouTube Data API נכשל, אבל ה-RSS feed עובד כ-fallback. <strong>האתר ממשיך להציג סרטונים</strong> (עד 15 אחרונים, ללא סינון shorts/long מלא).</p>
       <p>זו לא תקלה דחופה, אבל כדאי לתקן את המפתח כשיש זמן — אחרת יוצגו פחות סרטונים מהרגיל.</p>`;

  const fixSteps = `
    <h3 style="margin-top:24px;color:#06415D">מה לעשות:</h3>
    <ol style="line-height:1.8">
      <li>היכנס ל-<a href="https://console.cloud.google.com/apis/credentials">Google Cloud Console — Credentials</a></li>
      <li>ודא שיש מפתח API פעיל ושה-<strong>YouTube Data API v3</strong> מופעל באותו פרויקט</li>
      <li>אם המפתח לא קיים — צור חדש (אל תוסיף restrictions)</li>
      <li>עדכן אותו ב-<a href="https://vercel.com/dashboard">Vercel Dashboard</a> → Project → Settings → Environment Variables → <code>YOUTUBE_API_KEY</code></li>
      <li>לחץ Redeploy ב-Vercel — תוך שעה הסנכרון יחזור אוטומטית</li>
    </ol>`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;direction:rtl;text-align:right">
      <div style="background:#06415D;color:white;padding:18px 22px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:20px">${statusBadge} סנכרון יוטיוב</h1>
      </div>
      <div style="padding:22px;background:#f9f9f9;border-radius:0 0 8px 8px">
        ${explanation}

        <h3 style="margin-top:20px;color:#06415D">פירוט:</h3>
        <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #e5e5e5;border-radius:6px">
          <tr style="border-bottom:1px solid #e5e5e5">
            <td style="padding:10px;font-weight:600">YouTube Data API</td>
            <td style="padding:10px">${result.apiOk ? "✅ תקין" : `❌ נכשל — <code style='font-size:12px'>${result.apiError ?? "unknown"}</code>`}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:600">RSS Feed (גיבוי)</td>
            <td style="padding:10px">${result.rssOk ? `✅ תקין (${result.videosCount} סרטונים)` : `❌ נכשל — <code style='font-size:12px'>${result.rssError ?? "unknown"}</code>`}</td>
          </tr>
        </table>

        ${fixSteps}

        <p style="margin-top:24px;font-size:12px;color:#888">
          התראה זו נשלחת אוטומטית פעם ביום, כל עוד הבעיה קיימת. ברגע שהמצב יחזור לתקין — האימיילים יפסיקו אוטומטית.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"אתר הרב רועי אמגר" <${user}>`,
    to,
    subject,
    html,
  });
}

export async function GET(req: NextRequest) {
  // אימות — מקבל גם Vercel Cron header וגם Bearer token ידני
  const isVercelCron = req.headers.get("user-agent")?.includes("vercel-cron");
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const isAuthorized = isVercelCron || bearer === process.env.CRON_SECRET;
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [api, rss] = await Promise.all([checkYouTubeAPI(), checkRSS()]);

  const result: CheckResult = {
    source: api.ok ? "api" : rss.ok ? "rss" : "none",
    apiOk: api.ok,
    rssOk: rss.ok,
    apiError: api.error,
    rssError: rss.error,
    videosCount: api.ok ? api.count : rss.count,
  };

  // שולחים אימייל רק אם API לא תקין (גם אם RSS עובד — כדי שתדע לתקן)
  if (!api.ok) {
    try {
      await sendAlertEmail(result);
      console.log("[health] alert email sent. status:", result.source);
    } catch (e) {
      console.error("[health] failed to send alert:", (e as Error).message);
    }
  }

  return NextResponse.json({
    ok: api.ok,
    ...result,
    timestamp: new Date().toISOString(),
    note: api.ok
      ? "סנכרון API פעיל — האתר עובד אופטימלית"
      : rss.ok
      ? "API נכשל — RSS משמש כגיבוי. האתר עובד אבל עם פחות סרטונים."
      : "שני המקורות נכשלו — נדרש טיפול דחוף",
  });
}
