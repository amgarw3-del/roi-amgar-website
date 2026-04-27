"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const errorMessages: Record<string, string> = {
  google_cancelled: "ההתחברות בוטלה",
  state_mismatch: "שגיאת אבטחה — נסה שוב",
  not_authorized: "המייל שלך אינו מורשה",
  auth_failed: "שגיאה בהתחברות — נסה שוב",
};

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "var(--color-warm)" }}
        >
          <span className="text-2xl">✡</span>
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
          לוח המנהל
        </h1>
        <p className="text-gray-400 text-sm mb-8">הרב רועי אמגר</p>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">
            {errorMessages[error] ?? "שגיאה — נסה שוב"}
          </div>
        )}

        <a
          href="/api/admin/google-auth"
          className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 46c5.6 0 10.6-1.9 14.5-5.1l-6.7-5.5C29.8 37 27 38 24 38c-5.7 0-10.6-3.1-11.8-7.5l-6.9 5.4C9.5 42.5 16.2 46 24 46z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.8 2.3-2.3 4.3-4.3 5.9l6.7 5.5C42.1 36.4 45 30.6 45 24c0-1.3-.2-2.7-.5-4z"/>
          </svg>
          כניסה עם Google
        </a>

        <p className="text-gray-300 text-xs mt-6">גישה מורשית בלבד</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
