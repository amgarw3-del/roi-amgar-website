"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import BottomNav from "./BottomNav";
import AdminBar from "./AdminBar";
import Footer from "./Footer";
import NewsletterPopup from "./NewsletterPopup";
import ChatBubble from "./chat/ChatBubble";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <AdminBar />
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav />
      <Footer />
      <NewsletterPopup />
      <ChatBubble />
    </>
  );
}
