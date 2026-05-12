/**
 * lib/whatsapp-green-api.ts
 *
 * שליחת WhatsApp דרך Green API (https://green-api.com).
 * חינמי לחלוטין במסלול Developer: 50 הודעות/יום.
 *
 * הקמה חד-פעמית:
 * 1. הרשמה: https://green-api.com/en/
 * 2. צור Instance מסוג "Developer"
 * 3. סרוק QR code עם וואטסאפ של הרב (פעם אחת)
 * 4. העתק את idInstance + apiTokenInstance
 * 5. הוסף ל-env:
 *    GREEN_API_ID_INSTANCE=1101000001
 *    GREEN_API_TOKEN=d75b...
 *    RABBI_PHONE=972501234567   (פורמט בינלאומי בלי + או רווחים)
 */

const GREEN_API_BASE = "https://api.green-api.com";

export interface GreenSendResult {
  ok: boolean;
  status: number;
  body: string;
  idMessage?: string;
}

function getConfig() {
  const idInstance = process.env.GREEN_API_ID_INSTANCE;
  const apiToken = process.env.GREEN_API_TOKEN;
  const phone = process.env.RABBI_PHONE;
  if (!idInstance || !apiToken || !phone) {
    throw new Error("Missing GREEN_API_ID_INSTANCE / GREEN_API_TOKEN / RABBI_PHONE");
  }
  return { idInstance, apiToken, phone };
}

/** ממיר מספר טלפון ל-chatId של Green API (יחיד) */
function toChatId(phone: string): string {
  return `${phone}@c.us`;
}

/** שליחת טקסט */
export async function sendGreenText(text: string): Promise<GreenSendResult> {
  const { idInstance, apiToken, phone } = getConfig();
  const url = `${GREEN_API_BASE}/waInstance${idInstance}/sendMessage/${apiToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: toChatId(phone),
      message: text,
    }),
  });

  const body = await res.text();
  let idMessage: string | undefined;
  try {
    idMessage = JSON.parse(body).idMessage;
  } catch {}

  return { ok: res.ok && !!idMessage, status: res.status, body, idMessage };
}

/** שליחת תמונה מ-URL ציבורי + caption */
export async function sendGreenImage(imageUrl: string, caption?: string): Promise<GreenSendResult> {
  const { idInstance, apiToken, phone } = getConfig();
  const url = `${GREEN_API_BASE}/waInstance${idInstance}/sendFileByUrl/${apiToken}`;

  // שם קובץ נדרש על ידי Green API — נחלץ מה-URL או נשתמש בברירת מחדל
  const filename = imageUrl.split("/").pop()?.split("?")[0] || "image.png";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: toChatId(phone),
      urlFile: imageUrl,
      fileName: filename,
      caption: caption || "",
    }),
  });

  const body = await res.text();
  let idMessage: string | undefined;
  try {
    idMessage = JSON.parse(body).idMessage;
  } catch {}

  return { ok: res.ok && !!idMessage, status: res.status, body, idMessage };
}

/**
 * שליחה מלאה: תמונה + caption (או טקסט בלבד אם אין תמונה).
 * אם תמונה נכשלה — fallback לטקסט בלבד.
 */
export async function sendGreenDivarTora(
  text: string,
  imageUrl?: string
): Promise<{ image: GreenSendResult | null; text: GreenSendResult | null }> {
  if (imageUrl) {
    const img = await sendGreenImage(imageUrl, text).catch((e) => ({
      ok: false,
      status: 0,
      body: String(e),
    }));
    if (img.ok) return { image: img, text: null };
    // fallback: שולחים טקסט נפרד
    const txt = await sendGreenText(text);
    return { image: img, text: txt };
  }
  const txt = await sendGreenText(text);
  return { image: null, text: txt };
}

/** בדיקת חיבור (לטסטים) */
export async function checkGreenStatus(): Promise<{ ok: boolean; state: string; body: string }> {
  const { idInstance, apiToken } = getConfig();
  const url = `${GREEN_API_BASE}/waInstance${idInstance}/getStateInstance/${apiToken}`;
  const res = await fetch(url);
  const body = await res.text();
  let state = "unknown";
  try {
    state = JSON.parse(body).stateInstance;
  } catch {}
  return { ok: res.ok && state === "authorized", state, body };
}
