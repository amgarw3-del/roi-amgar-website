"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import type { YouTubeVideo } from "@/lib/youtube";

interface Props {
  videos: YouTubeVideo[];
  title: string;
  isShorts?: boolean;
}

export default function VideoCarousel({ videos, title, isShorts = false }: Props) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.querySelector("button")?.offsetWidth ?? 260;
    track.scrollBy({ left: dir === "next" ? -(cardWidth + 16) : (cardWidth + 16), behavior: "smooth" });
  }, []);

  if (!videos.length) return null;

  return (
    <div className="relative">
      {/* כותרת + חצים */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
            {title}
          </h2>
          <div className="divider" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("prev")}
            className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
            aria-label="הקודם"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            onClick={() => scroll("next")}
            className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
            aria-label="הבא"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* מסלול הגלילה */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto pb-3"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          direction: "rtl",
        }}
      >
        {videos.map((v) => (
          <button
            key={v.videoId}
            onClick={() => setActiveVideo(v.videoId)}
            className="group flex-shrink-0 text-right"
            style={{
              scrollSnapAlign: "start",
              width: isShorts ? "180px" : "260px",
            }}
          >
            {/* תמונה ממוזערת */}
            <div
              className="relative overflow-hidden rounded-xl mb-2"
              style={{ aspectRatio: isShorts ? "9/16" : "16/9" }}
            >
              <Image
                src={v.thumbnail}
                alt={v.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes={isShorts ? "180px" : "260px"}
              />
              {/* כפתור פליי */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
              </div>
              {isShorts && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  Shorts
                </div>
              )}
            </div>
            {/* כותרת */}
            <p
              className="text-sm font-semibold leading-snug line-clamp-2"
              style={{ color: "var(--color-primary)", direction: "rtl" }}
            >
              {v.title}
            </p>
          </button>
        ))}
      </div>

      {/* מודאל נגן */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-3xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-10 left-0 text-white text-3xl leading-none hover:text-gray-300 transition-colors"
              aria-label="סגור"
            >
              ✕
            </button>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ aspectRatio: isShorts ? "9/16" : "16/9", maxHeight: "80vh" }}
            >
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
