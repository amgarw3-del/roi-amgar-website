/**
 * app/api/cron/youtube-notify/route.ts
 *
 * קרון יומי (20:30 שעון ישראל) דרך GitHub Actions.
 * סורק את ערוץ היוטיוב, ואם עלה סרטון חדש מאז הסריקה הקודמת —
 * מרכיב הודעה מוכנה ושולח אותה לרב בוואטסאפ (להעתקה לערוץ).
 *
 * שלב 1: נשלח רק לרב (RABBI_PHONE). פרסום ישיר לערוץ = שלב עתידי.
 *
 * Query params:
 *   ?dry=true    — לא שולח, מחזיר JSON עם התצוגה המקדימה
 *   ?force=true  — מדלג על שער שעת-ישראל (לבדיקות)
 *
 * Auth: header `authorization: Bearer ${CRON_SECRET}`
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { fetchLatestUploadsWithDesc } from "@/lib/youtube/rss";
import { extractSentence, buildVideoMessage } from "@/lib/youtube-message-builder";
import { sendGreenText } from "@/lib/whatsapp-green-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SCAN_STATUS_ID = "scanStatus";
const MAX_PER_SCAN = 3; // הגנה מפני הצפה אם עלו כמה סרטונים ביום אחד

/** השעה הנוכחית בשעון ישראל (0-23). */
function israelHour(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jerusalem",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "true";
  const force = req.nextUrl.searchParams.get("force") === "true";
  // preview=true — מרכיב את ההודעה ל-N הסרטונים האחרונים בלי לגעת ב-state ובלי לשלוח
  const preview = req.nextUrl.searchParams.get("preview") === "true";
  // testSend=true — שולח בפועל את הסרטון האחרון לוואטסאפ בלי לגעת ב-state (בדיקה / שליחה ידנית)
  const testSend = req.nextUrl.searchParams.get("testSend") === "true";
  const previewCount = Math.min(
    Number(req.nextUrl.searchParams.get("count") ?? "1") || 1,
    MAX_PER_SCAN
  );

  // שער שעת ישראל — GitHub Actions מריץ בשתי שעות UTC (קיץ/חורף);
  // רק הריצה שנופלת על 20:00 בישראל פועלת בפועל.
  const hour = israelHour();
  if (hour !== 20 && !force) {
    return NextResponse.json({
      status: "skipped",
      reason: `not 20:00 in Israel (current hour: ${hour})`,
    });
  }

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    token: process.env.SANITY_API_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  try {
    // סרטונים אחרונים (הכי חדש ראשון)
    const videos = await fetchLatestUploadsWithDesc();
    if (videos.length === 0) {
      return NextResponse.json({ status: "no-videos" });
    }

    const newestId = videos[0].videoId;

    // preview — תצוגה מקדימה של ההודעות בלי state ובלי שליחה (לבדיקות)
    if (preview) {
      const sample = videos.slice(0, previewCount);
      const previews = sample.map((video) => {
        const sentence = extractSentence(video.description);
        return {
          videoId: video.videoId,
          title: video.title,
          publishedAt: video.publishedAt,
          sentenceSource: sentence ? "description" : "none",
          message: buildVideoMessage({ title: video.title, sentence, videoId: video.videoId }),
        };
      });
      return NextResponse.json({ status: "preview", previews });
    }

    // testSend — שליחה אמיתית של הסרטון האחרון לוואטסאפ, בלי לגעת ב-state
    if (testSend) {
      const video = videos[0];
      const sentence = extractSentence(video.description);
      const message = buildVideoMessage({ title: video.title, sentence, videoId: video.videoId });
      let whatsapp = "skipped (no green-api config)";
      if (process.env.GREEN_API_ID_INSTANCE && process.env.GREEN_API_TOKEN) {
        const r = await sendGreenText(message);
        whatsapp = r.ok ? "sent" : `failed (${r.status})`;
      }
      return NextResponse.json({ status: "test-send", videoId: video.videoId, whatsapp, message });
    }

    // סטטוס סריקה קודם
    const state = await sanity.fetch<{ _id: string; latestVideoId: string | null } | null>(
      `*[_type == "scanStatus"][0]{ _id, latestVideoId }`
    );
    const lastSeenId = state?.latestVideoId ?? null;

    // Bootstrap: ריצה ראשונה — קובעים קו בסיס בלי לשלוח
    if (!lastSeenId) {
      if (!dryRun) {
        await saveScanStatus(sanity, state?._id, newestId);
      }
      return NextResponse.json({
        status: "initialized",
        message: "קו בסיס נקבע — לא נשלחו הודעות בריצה הראשונה",
        latestVideoId: newestId,
      });
    }

    // סרטונים חדשים = כל מה שלפני lastSeenId ברשימה (הכי חדש ראשון)
    const idx = videos.findIndex((v) => v.videoId === lastSeenId);
    const newVideos = (idx === -1 ? videos : videos.slice(0, idx)).slice(0, MAX_PER_SCAN);

    if (newVideos.length === 0) {
      return NextResponse.json({ status: "no-new-videos", latestVideoId: newestId });
    }

    // שולחים בסדר כרונולוגי (הישן מבין החדשים קודם)
    const ordered = [...newVideos].reverse();

    const results: Array<Record<string, unknown>> = [];
    for (const video of ordered) {
      const sentence = extractSentence(video.description);
      const message = buildVideoMessage({
        title: video.title,
        sentence,
        videoId: video.videoId,
      });

      if (dryRun) {
        results.push({
          videoId: video.videoId,
          title: video.title,
          sentenceSource: sentence ? "description" : "none",
          message,
        });
        continue;
      }

      let sendResult: Record<string, unknown>;
      if (process.env.GREEN_API_ID_INSTANCE && process.env.GREEN_API_TOKEN) {
        try {
          const r = await sendGreenText(message);
          sendResult = { videoId: video.videoId, whatsapp: r.ok ? "sent" : `failed (${r.status})` };
        } catch (e) {
          sendResult = {
            videoId: video.videoId,
            whatsapp: `error: ${e instanceof Error ? e.message : String(e)}`,
          };
        }
      } else {
        sendResult = { videoId: video.videoId, whatsapp: "skipped (no green-api config)" };
      }
      results.push(sendResult);
    }

    // עדכון קו הבסיס לסרטון הכי חדש (רק בשליחה אמיתית)
    if (!dryRun) {
      await saveScanStatus(sanity, state?._id, newestId);
    }

    return NextResponse.json({
      status: dryRun ? "dry-run" : "sent",
      newCount: newVideos.length,
      latestVideoId: newestId,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}

/** שומר/מעדכן את מסמך scanStatus (singleton). */
async function saveScanStatus(
  sanity: ReturnType<typeof createClient>,
  existingId: string | undefined,
  latestVideoId: string
): Promise<void> {
  const now = new Date().toISOString();
  if (existingId) {
    await sanity.patch(existingId).set({ latestVideoId, lastScannedAt: now }).commit();
  } else {
    await sanity.createIfNotExists({
      _id: SCAN_STATUS_ID,
      _type: "scanStatus",
      latestVideoId,
      lastScannedAt: now,
    });
  }
}
