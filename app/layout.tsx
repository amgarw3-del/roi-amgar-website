import type { Metadata } from "next";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { Analytics } from "@vercel/analytics/react";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-frank",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://haravroiamgar.com"),
  title: {
    default: "הרב רועי אמגר | תורה לחיים",
    template: "%s | הרב רועי אמגר",
  },
  description:
    "שיעורי תורה, הלכה, אמונה וזוגיות — הרב רועי אמגר. שאלות ותשובות, פרשת שבוע ועוד.",
  keywords: ["הרב רועי אמגר", "שיעורי תורה", "הלכה", "פרשת שבוע", "זוגיות"],
  authors: [{ name: "הרב רועי אמגר" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "הרב אמגר",
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "הרב רועי אמגר",
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${frankRuhl.variable} h-full`}
    >
      <head>
        {gaId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
              }}
            />
          </>
        )}
      </head>
      <body className="font-heebo min-h-full flex flex-col">
        <SiteShell>{children}</SiteShell>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
              if (window.matchMedia('(display-mode: standalone)').matches) {
                document.cookie = 'pwa=1; path=/; max-age=31536000';
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
