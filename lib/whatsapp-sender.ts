/**
 * lib/whatsapp-sender.ts
 *
 * שליחת הודעות WhatsApp לרב דרך CallMeBot (חינמי).
 *
 * הגדרה חד-פעמית:
 * 1. הוסף את הטלפון +34 644 51 95 23 לאנשי הקשר ("CallMeBot")
 * 2. שלח אליו ב-WhatsApp: "I allow callmebot to send me messages"
 * 3. תקבל בחזרה API key (תוקף לעולם)
 * 4. הגדר env:
 *    RABBI_PHONE (פורמט: 972501234567 — בלי + או רווחים)
 *    CALLMEBOT_API_KEY
 */

const CALLMEBOT_BASE = "https://api.callmebot.com/whatsapp.php";

export interface SendResult {
  ok: boolean;
  status: number;
  body: string;
}

/** שליחת הודעת טקסט */
export async function sendWhatsAppText(text: string): Promise<SendResult> {
  const phone = process.env.RABBI_PHONE;
  const apiKey = process.env.CALLMEBOT_API_KEY;
  if (!phone || !apiKey) throw new Error("RABBI_PHONE or CALLMEBOT_API_KEY not configured");

  const url = new URL(CALLMEBOT_BASE);
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), { method: "GET" });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

/**
 * שליחת תמונה עם caption.
 * CallMeBot מקבל URL ציבורי של תמונה דרך פרמטר `image`.
 */
export async function sendWhatsAppImage(imageUrl: string, caption?: string): Promise<SendResult> {
  const phone = process.env.RABBI_PHONE;
  const apiKey = process.env.CALLMEBOT_API_KEY;
  if (!phone || !apiKey) throw new Error("RABBI_PHONE or CALLMEBOT_API_KEY not configured");

  const url = new URL(CALLMEBOT_BASE);
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", caption || "");
  url.searchParams.set("image", imageUrl);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), { method: "GET" });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

/**
 * שליחת הודעה מלאה: תמונה + caption.
 * אם תמונה fails — שולח את הטקסט בנפרד.
 */
export async function sendDivarToraMessage(
  text: string,
  imageUrl?: string
): Promise<{ image: SendResult | null; text: SendResult | null }> {
  if (imageUrl) {
    const imgRes = await sendWhatsAppImage(imageUrl, text).catch((e) => ({
      ok: false,
      status: 0,
      body: String(e),
    }));
    if (imgRes.ok) return { image: imgRes, text: null };
    // fallback לטקסט
    const txtRes = await sendWhatsAppText(text);
    return { image: imgRes, text: txtRes };
  }

  const txtRes = await sendWhatsAppText(text);
  return { image: null, text: txtRes };
}
