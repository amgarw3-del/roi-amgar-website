export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function makeHmac(message: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "fallback-dev-secret";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function createAdminSession(): Promise<string> {
  const exp = Date.now() + SESSION_TTL_MS;
  const sig = await makeHmac(String(exp));
  return `${exp}.${sig}`;
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Date.now() > exp) return false;
  const expected = await makeHmac(expStr);
  return safeEqual(expected, sig);
}
