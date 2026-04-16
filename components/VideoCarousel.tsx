"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { YouTubeVideo } from "@/lib/youtube";

const SHORTS_CATEGORIES = [
  { label: "הכל", key: "" },
  { label: "פרשת שבוע", key: "פרשת שבוע" },
  { label: "אור החיים", key: "אור החיים" },
  { label: "חיזוק באמונה", key: "אמונה" },
  { label: "הכלה בהליכה", key: "הכלה" },
];

const EXCLUDE_TITLES = ["שיר השירים"];

interface Props {
  videos: YouTubeVideo[];
  title: string;
  isShorts?: boolean;
}

export default function VideoCarousel({ videos, title, isShorts = false }: Props) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);

  // drag-to-scroll state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const scroll = useCallback((dir: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.querySelector("button")?.offsetWidth ?? 260;
    track.scrollBy({ left: dir === "next" ? -(cardWidth + 16) : (cardWidth + 16), behavior: "smooth" });
  }, []);

  // Mouse drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return;
    isDragging.current = true;
    startX.current = e.pageX - track.offsetLeft;
    scrollLeft.current = track.scrollLeft;
    track.style.cursor = "grabbing";
    track.style.userSelect = "none";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const track = trackRef.current;
    if (!track) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    track.scrollLeft = scrollLeft.current - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    const track = trackRef.current;
    if (track) {
      track.style.cursor = "grab";
      track.style.userSelect = "";
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (track) track.style.cursor = "grab";
  }, []);

  // Filter videos
  const filtered = videos.filter((v) => {
    const titleLower = v.title.toLowerCase();
    // Exclude unwanted series
    if (EXCLUDE_TITLES.some((ex) => v.title.includes(ex))) return false;
    // Apply category filter
    if (activeFilter && !titleLower.includes(activeFilter.toLowerCase())) return false;
    return true;
  });

  if (!videos.length) return null;

  return (
    <div className="relative">
      {/* כותרת + חצים */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
            {title}
          </h2>
          <div className="divider" />
        </div>
        <div className="hidden sm:flex gap-2">
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

      {/* טאבי קטגוריות לרגע של תורה */}
      {isShorts && (
        <div className="flex gap-2 flex-wrap mb-4" style={{ direction: "rtl" }}>
          {SHORTS_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveFilter(cat.key)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors"
              style={
                activeFilter === cat.key
                  ? { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                  : { background: "white", color: "var(--color-primary)", borderColor: "var(--color-primary)" }
              }
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* מסלול הגלילה */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto pb-3 select-none"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          direction: "rtl",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {filtered.length === 0 ? (
          <p className="text-gray-400 py-8 w-full text-center">אין סרטונים בקטגוריה זו</p>
        ) : (
          filtered.map((v) => (
            <button
              key={v.videoId}
              onClick={() => !isDragging.current && setActiveVideo(v.videoId)}
              className="group flex-shrink-0 text-right"
              style={{
                scrollSnapAlign: "start",
                width: isShorts ? "160px" : "260px",
                cursor: "inherit",
              }}
            >
              <div
                className="relative overflow-hidden rounded-xl mb-2"
                style={{ aspectRatio: isShorts ? "9/16" : "16/9" }}
              >
                <Image
                  src={v.thumbnail}
                  alt={v.title}
                  fill
                  draggable={false}
                  className="object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                  sizes={isShorts ? "160px" : "260px"}
                />
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
              <p
                className="text-sm font-semibold leading-snug line-clamp-2"
                style={{ color: "var(--color-primary)", direction: "rtl" }}
              >
                {v.title}
              </p>
            </button>
          ))
        )}
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
