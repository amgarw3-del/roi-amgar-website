import { client, queries } from "@/sanity/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Clock, Share2 } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await client.fetch(queries.videoBySlug(slug)).catch(() => null);
  if (!video) return { title: "שיעור לא נמצא" };
  return {
    title: video.title,
    description: video.summary?.slice(0, 155),
    openGraph: {
      title: video.title,
      description: video.summary?.slice(0, 155),
      images: video.youtubeId
        ? [`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`]
        : [],
    },
  };
}

export default async function ShiurPage({ params }: Props) {
  const { slug } = await params;
  const video = await client.fetch(queries.videoBySlug(slug)).catch(() => null);
  if (!video) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.summary,
    uploadDate: video.publishedAt,
    thumbnailUrl: video.youtubeId
      ? `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`
      : undefined,
    embedUrl: video.youtubeId
      ? `https://www.youtube.com/embed/${video.youtubeId}`
      : undefined,
    author: {
      "@type": "Person",
      name: "הרב רועי אמגר",
    },
  };

  const formattedDate = video.publishedAt
    ? new Date(video.publishedAt).toLocaleDateString("he-IL", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary">בית</Link>
          <ChevronLeft size={14} />
          {video.category && (
            <>
              <Link href={`/${video.category.slug?.current}`} className="hover:text-primary">
                {video.category.hebrewName}
              </Link>
              <ChevronLeft size={14} />
            </>
          )}
          <span className="text-gray-900 font-medium line-clamp-1">{video.title}</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          {/* Video */}
          {video.youtubeId && (
            <div className="relative aspect-video rounded-xl overflow-hidden mb-6 shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                loading="lazy"
              />
            </div>
          )}

          {/* Title & meta */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {video.category && (
                <Link href={`/${video.category.slug?.current}`}>
                  <span className="badge">{video.category.hebrewName}</span>
                </Link>
              )}
              {video.hebrewDate && (
                <span className="text-gray-400 text-sm">{video.hebrewDate}</span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--color-primary)" }}>
              {video.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {formattedDate && (
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {formattedDate}
                </span>
              )}
              <button
                className="flex items-center gap-1 hover:text-primary transition-colors"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: video.title, url: window.location.href });
                  }
                }}
              >
                <Share2 size={14} /> שתף
              </button>
            </div>
          </div>

          {/* Summary */}
          {video.summary && (
            <div
              className="rounded-xl p-6 mb-6"
              style={{ background: "var(--color-warm)" }}
            >
              <h2 className="font-bold text-lg mb-3" style={{ color: "var(--color-primary)" }}>
                תקציר השיעור
              </h2>
              <div className="prose-hebrew">{video.summary}</div>
            </div>
          )}

          {/* WhatsApp share */}
          <div className="flex gap-3 mt-6">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${video.title} - הרב רועי אמגר\n`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              📱 שתף בוואטסאפ
            </a>
            <Link href="/shaal" className="btn-primary text-sm">
              שאל שאלה על השיעור
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
