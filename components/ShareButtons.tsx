"use client";

import { useState } from "react";
import { Share2, Link as LinkIcon, Check } from "lucide-react";

interface Props {
  title: string;
  path: string;
}

export default function ShareButtons({ title, path }: Props) {
  const [copied, setCopied] = useState(false);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haravroiamgar.com";
  const shareUrl = `${SITE_URL}${path}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${shareUrl}`)}`;

  return (
    <>
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
        aria-label="העתק קישור"
      >
        {copied ? <Check size={15} /> : <LinkIcon size={15} />}
        {copied ? "הועתק" : "העתק קישור"}
      </button>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
        style={{ background: "#25d366" }}
        aria-label="שתף בוואטסאפ"
      >
        <Share2 size={15} />
        שתף בוואטסאפ
      </a>
    </>
  );
}
