"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { YouTubeVideo } from "@/lib/youtube";

const SHORTS_CATEGORIES = [
  { label: "הכל", key: "" },
  { label: "פרשת שבוע", key: "פרשת" },
  { label: "אור החיים", key: "אור החיים" },
  { label: "חיזוק באמונה", key: "אמונה" },
  { label: "הלכה בהליכה", key: "הלכה" },
];

const EXCLUDE_TITLES = ["שיר השירים", "תלמוד תורה וירטואלי"];

interface Props {
  videos: YouTubeVideo[];
  title: string;
  isShorts?: boolean;
}

export default function VideoCarousel({ videos, title, isShorts = false }: Props) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragMoved = useRef(false);

  const CARD_W = isShorts ? 176 : 276; // card width + gap

  const filtered = videos.filter((v) => {
    if (EXCLUDE_TITLES.some((ex) => v.title.includes(ex))) return false;
    if (activeFilter && !v.title.includes(activeFilter)) return false;
    return true;
  });

  // גלילה עם לולאה
  const scrollTo = useCallback((dir: "next" | "prev") => {
    const track = trackRef.current;
    if (!track) return;
    const totalWidth = track.scrollWidth;
    const visibleWidth = track.clientWidth;
    // בגלל RTL, scrollLeft יכול להיות שלילי בחלק מהדפדפנים
    const currentScroll = Math.abs(track.scrollLeft);

    if (dir === "next") {
      // הזזה שמאלה (סרטון הבא ב-RTL)
      const newScroll = currentScroll + CARD_W;
      if (newScroll + visibleWidth >= totalWidth - 10) {
        // הגענו לסוף — חזור להתחלה
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: -(CARD_W), behavior: "smooth" });
      }
    } else {
      // הזזה ימינה
      if (currentScroll <= 10) {
        // בהתחלה — קפוץ לסוף
        track.scrollTo({ left: -(totalWidth - visibleWidth), behavior: "smooth" });
      } else {
        track.scrollBy({ left: CARD_W, behavior: "smooth" });
      }
    }
  }, [CARD_W]);

  // Mouse drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return;
    isDragging.current = true;
    dragMoved.current = false;
    startX.current = e.pageX;
    scrollLeft.current = track.scrollLeft;
    track.style.cursor = "grabbing";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.pageX - startX.current;
    if (Math.abs(dx) > 5) dragMoved.current = true;
    track.scrollLeft = scrollLeft.current - dx;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    const track = trackRef.current;
    if (track) track.style.cursor = "grab";
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (track) track.style.cursor = "grab";
  }, []);

  // Escape key לסגירת מודאל
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveVideo(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!videos.length) return null;

  return (
    <div className="relative">
      {/* כותרת */}
      <div className="mb-4 px-1">
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>{title}</h2>
        <div className="divider" />
      </div>

      {/* טאבי קטגוריות */}
      {isShorts && (
        <div className="flex gap-2 flex-wrap mb-4" style={{ direction: "rtl" }}>
          {SHORTS_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveFilter(cat.key)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors"
              style={activeFilter === cat.key
                ? { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                : { background: "white", color: "var(--color-primary)", borderColor: "var(--color-primary)" }
              }
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* עטיפת הקרוסל עם חצים בצדדים */}
      <div className="relative group">
        {/* חץ ימין (הקודם ב-RTL) */}
        <button
          onClick={() => scrollTo("prev")}
          aria-label="הקודם"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
          style={{ transform: "translateY(-50%) translateX(50%)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        {/* חץ שמאל (הבא ב-RTL) */}
        <button
          onClick={() => scrollTo("next")}
          aria-label="הבא"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
          style={{ transform: "translateY(-50%) translateX(-50%)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        {/* מסלול */}
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
          ) : filtered.map((v) => (
            <button
              key={v.videoId}
              onClick={() => { if (!dragMoved.current) setActiveVideo(v.videoId); }}
              className="group/card flex-shrink-0 text-right"
              style={{ scrollSnapAlign: "start", width: isShorts ? "160px" : "260px", cursor: "inherit" }}
            >
              <div className="relative overflow-hidden rounded-xl mb-2" style={{ aspectRatio: isShorts ? "9/16" : "16/9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105 pointer-events-none"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/card:bg-black/40 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover/card:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                </div>
                {isShorts && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full font-bold">Shorts</div>
                )}
              </div>
              <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: "var(--color-primary)", direction: "rtl" }}>
                {v.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* מודאל */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80"
          onClick={() => setActiveVideo(null)}
        >
          {/* כפתור סגירה */}
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 transition-colors flex items-center justify-center text-white text-xl"
            aria-label="סגור"
          >
            ✕
          </button>
          {/* נגן — stopPropagation רק על ה-iframe עצמו */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="rounded-2xl overflow-hidden w-full max-w-3xl"
              style={{
                aspectRatio: isShorts ? "9/16" : "16/9",
                maxHeight: "85vh",
                pointerEvents: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
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
