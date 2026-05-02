import { NextRequest, NextResponse } from "next/server";
import { createOAuthState, isAllowedOriginHost } from "@/lib/admin-auth";

// כתובת ה-callback הרשומה ב-Google Cloud Console.
// כל בקשת OAuth עוברת דרך כאן — גם אם המשתמש מגיע מדומיין אחר —
// וה-callback ידע להחזיר את המשתמש לדומיין המקורי.
const REGISTERED_CALLBACK_HOST = "website-seven-kappa-25.vercel.app";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  // הדומיין שממנו המשתמש מגיע (haravroiamgar.com / vercel.app וכו')
  const originHost = req.headers.get("host") ?? REGISTERED_CALLBACK_HOST;
  if (!isAllowedOriginHost(originHost)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  // state חתום שמכיל את הדומיין המקורי — לא צריך cookie
  const state = await createOAuthState(originHost);

  // redirect_uri קבוע — חייב להיות זהה לזה שרשום ב-Google Console
  const redirectUri = `https://${REGISTERED_CALLBACK_HOST}/api/admin/google-callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
