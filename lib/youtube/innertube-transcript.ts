/**
 * lib/youtube/innertube-transcript.ts
 *
 * שליפת תמלול יוטיוב דרך InnerTube (לקוח ANDROID).
 * שיטה זו עוקפת את חסימת השרת של יוטיוב ל-timedtext, שבגללה
 * שליפת תמלול ישירה מדף הצפייה מחזירה ריק (בוט-דיטקשן).
 * אומת על שיעורי הרב עם כתוביות עברית (lang=iw).
 *
 * מחזיר null בכל כשל (אין כתוביות / שינוי מבנה / רשת) — לא זורק.
 */

const CLIENT_VERSION = "20.10.38";
const ANDROID_UA = `com.google.android.youtube/${CLIENT_VERSION} (Linux; U; Android 14)`;

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  kind?: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

async function getCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": ANDROID_UA },
    body: JSON.stringify({
      context: { client: { clientName: "ANDROID", clientVersion: CLIENT_VERSION } },
      videoId,
    }),
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => null);
  const tracks =
    json?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  return Array.isArray(tracks) ? tracks : [];
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  const isHe = (t: CaptionTrack) => t.languageCode === "iw" || t.languageCode === "he";
  return (
    tracks.find((t) => isHe(t) && t.kind !== "asr") ||
    tracks.find((t) => isHe(t)) ||
    tracks[0]
  );
}

/** מחזיר את התמלול המלא כטקסט רציף, או null בכשל. */
export async function fetchTranscriptInnerTube(videoId: string): Promise<string | null> {
  try {
    const tracks = await getCaptionTracks(videoId);
    const track = pickTrack(tracks);
    if (!track?.baseUrl) return null;

    const res = await fetch(track.baseUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const xml = await res.text();

    let segs = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
      decodeEntities(m[1].replace(/<[^>]+>/g, "")).trim()
    );
    if (segs.length === 0) {
      segs = [...xml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) =>
        decodeEntities(m[1].replace(/<[^>]+>/g, "")).trim()
      );
    }
    const text = segs.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    return text.length >= 200 ? text : null;
  } catch {
    return null;
  }
}
