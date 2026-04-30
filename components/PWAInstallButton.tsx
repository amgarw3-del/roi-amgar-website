"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

type InstallState = "loading" | "available" | "ios" | "installed" | "hidden";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallButton() {
  const [state, setState] = useState<InstallState>("loading");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTooltip, setShowIosTooltip] = useState(false);

  useEffect(() => {
    // Already running as installed PWA — hide the button
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setState("hidden");
      return;
    }

    // iOS detection (Safari doesn't fire beforeinstallprompt)
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as { standalone?: boolean }).standalone;
    if (isIos) {
      setState("ios");
      return;
    }

    // Listen for the install prompt (Android / Chrome desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState("available");
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    const installedHandler = () => {
      setState("installed");
      track("pwa_installed");
    };
    window.addEventListener("appinstalled", installedHandler);

    // Tag PWA sessions for Vercel Analytics
    document.cookie = "pwa_source=browser; path=/; max-age=31536000";

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (state === "ios") {
      track("pwa_install_click", { platform: "ios" });
      setShowIosTooltip((v) => !v);
      return;
    }
    if (!deferredPrompt) return;
    track("pwa_install_click", { platform: "android" });
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setState("installed");
    setDeferredPrompt(null);
  };

  if (state === "loading" || state === "hidden") return null;

  if (state === "installed") {
    return (
      <button
        onClick={() => window.open("/", "_blank")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "16px",
          fontWeight: 600,
          color: "#166534",
          padding: "16px 4px",
          background: "none",
          border: "none",
          borderBottom: "1.5px solid #166534",
          cursor: "pointer",
          fontFamily: "inherit",
        } as React.CSSProperties}
      >
        ✓ האפליקציה מותקנת
      </button>
    );
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={handleInstall}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "16px",
          fontWeight: 600,
          color: "#fff",
          padding: "16px 32px",
          background: "var(--color-ochre)",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        ⬇ הורד אפליקציה
      </button>

      {/* iOS tooltip */}
      {state === "ios" && showIosTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 12px)",
            right: "0",
            background: "#1a2744",
            color: "#f5f0e8",
            borderRadius: "12px",
            padding: "14px 16px",
            fontSize: "13px",
            lineHeight: "1.6",
            width: "230px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            zIndex: 50,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "6px", color: "#f5c96e" }}>
            הוספה למסך הבית
          </div>
          <div>
            1. לחץ על כפתור השיתוף{" "}
            <span style={{ fontSize: "16px" }}>⎙</span>
          </div>
          <div>
            2. בחר &quot;הוסף למסך הבית&quot;{" "}
            <span style={{ fontSize: "14px" }}>＋</span>
          </div>
          <div>3. לחץ &quot;הוסף&quot;</div>
          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              bottom: "-8px",
              right: "20px",
              width: "0",
              height: "0",
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid #1a2744",
            }}
          />
        </div>
      )}
    </div>
  );
}
