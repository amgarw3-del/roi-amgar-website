import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
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
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="font-heebo min-h-full flex flex-col bg-white text-gray-900">
        <Header />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
