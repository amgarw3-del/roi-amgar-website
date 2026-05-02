import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, verifyOAuthState, isAllowedOriginHost } from "@/lib/admin-auth";

const REGISTERED_CALLBACK_HOST = "website-seven-kappa-25.vercel.app";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // ה-state חתום ומכיל את הדומיין המקורי
  const verified = state ? await verifyOAuthState(state) : null;
  const originHost = verified && isAllowedOriginHost(verified.originHost)
    ? verified.originHost
    : REGISTERED_CALLBACK_HOST;

  const loginUrl = new URL(`https://${originHost}/admin/login`);

  if (error || !code || !verified) {
    loginUrl.searchParams.set("error", error ? "google_cancelled" : "state_mismatch");
    return NextResponse.redirect(loginUrl);
  }

  const redirectUri = `https://${REGISTERED_CALLBACK_HOST}/api/admin/google-callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) throw new Error("token_exchange_failed");
    const { access_token } = await tokenRes.json();

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) throw new Error("userinfo_failed");
    const { email } = await userRes.json() as { email?: string };

    const allowedEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
    if (!email || !allowedEmails.includes(email)) {
      loginUrl.searchParams.set("error", "not_authorized");
      return NextResponse.redirect(loginUrl);
    }

    const sessionToken = await createAdminSession();

    // העברה לדומיין המקורי — שם ייקבע ה-cookie ויתבצע redirect ל-/admin
    const finishUrl = new URL(`https://${originHost}/api/admin/finish-login`);
    finishUrl.searchParams.set("token", sessionToken);
    return NextResponse.redirect(finishUrl);
  } catch {
    loginUrl.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(loginUrl);
  }
}
