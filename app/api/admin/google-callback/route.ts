import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, SESSION_COOKIE_NAME } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const loginUrl = new URL("/admin/login", req.url);

  if (error || !code || !state) {
    loginUrl.searchParams.set("error", "google_cancelled");
    return NextResponse.redirect(loginUrl);
  }

  const storedState = req.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    loginUrl.searchParams.set("error", "state_mismatch");
    return NextResponse.redirect(loginUrl);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${req.headers.get("host")}`;
  const redirectUri = `${baseUrl}/api/admin/google-callback`;

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
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("oauth_state");
      return response;
    }

    const sessionToken = await createAdminSession();
    const response = NextResponse.redirect(new URL("/admin", req.url));
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    response.cookies.delete("oauth_state");
    return response;
  } catch {
    loginUrl.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(loginUrl);
  }
}
