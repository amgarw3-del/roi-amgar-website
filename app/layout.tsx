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
  metadataBase: new URL("https://roiamgar.co.il"),
  title: {
    default: "הרב רועי אמגר | תורה לחיים",
    template: "%s | הרב רועי אמגר",
  },
  description:
    "שיעורי תורה, הלכה, אמונה וזוגיות — הרב רועי אמגר. שאלות ותשובות, פרשת שבוע ועוד.",
  keywords: ["הרב רועי אמגר", "שיעורי תורה", "הלכה", "פרשת שבוע", "זוגיות"],
  authors: [{ name: "הרב רועי אמגר" }],
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
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${frankRuhl.variable} h-full`}
    >
      <body className="font-heebo min-h-full flex flex-col">
        <SiteShell>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
