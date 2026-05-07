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

export function safeEqual(a: string, b: string): boolean {
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

// ─── Signed state for cross-domain OAuth ─────────────────────────────────
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 דקות

function b64urlEncode(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64").toString("utf8");
}

export async function createOAuthState(originHost: string): Promise<string> {
  const nonce = crypto.randomUUID();
  const exp = Date.now() + OAUTH_STATE_TTL_MS;
  const payload = JSON.stringify({ nonce, exp, originHost });
  const encoded = b64urlEncode(payload);
  const sig = await makeHmac(encoded);
  return `${encoded}.${sig}`;
}

export async function verifyOAuthState(state: string): Promise<{ originHost: string } | null> {
  const dot = state.indexOf(".");
  if (dot === -1) return null;
  const encoded = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = await makeHmac(encoded);
  if (!safeEqual(expected, sig)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(encoded)) as { exp?: number; originHost?: string };
    if (!payload.exp || Date.now() > payload.exp) return null;
    if (!payload.originHost) return null;
    return { originHost: payload.originHost };
  } catch {
    return null;
  }
}

// אסור לאפשר הפניה לדומיינים זרים
const ALLOWED_ORIGIN_HOSTS = new Set([
  "www.haravroiamgar.com",
  "haravroiamgar.com",
  "website-seven-kappa-25.vercel.app",
]);

export function isAllowedOriginHost(host: string): boolean {
  if (ALLOWED_ORIGIN_HOSTS.has(host)) return true;
  // אפשר גם preview deployments של Vercel
  if (/^website-[a-z0-9]+-roi-amgars-projects\.vercel\.app$/.test(host)) return true;
  return false;
}
