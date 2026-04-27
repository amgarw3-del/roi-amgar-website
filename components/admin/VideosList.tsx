"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ExternalLink, RefreshCw } from "lucide-react";

interface VideoItem {
  _id: string;
  title: string;
  youtubeId: string;
  status: string;
  hidden: boolean;
  publishedAt: string;
  category?: { hebrewName: string };
}

interface Props {
  pending: VideoItem[];
  published: VideoItem[];
  hidden: VideoItem[];
}

function VideoRow({
  item,
  onToggle,
  onPublish,
}: {
  item: VideoItem;
  onToggle: (id: string, hidden: boolean) => void;
  onPublish?: (id: string) => void;
}) {
  const [busy, startTransition] = useTransition();

  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      {item.youtubeId && (
        <img
          src={`https://img.youtube.com/vi/${item.youtubeId}/default.jpg`}
          alt=""
          className="w-16 h-11 object-cover rounded-lg shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {item.category?.hebrewName ?? "—"}
          {item.publishedAt && (
            <> · {new Date(item.publishedAt).toLocaleDateString("he-IL")}</>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onPublish && (
          <button
            onClick={() => startTransition(() => onPublish(item._id))}
            disabled={busy}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            פרסם
          </button>
        )}
        <button
          onClick={() => startTransition(() => onToggle(item._id, !item.hidden))}
          disabled={busy}
          title={item.hidden ? "הצג באתר" : "הסתר מהאתר"}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-40 transition-colors"
        >
          {item.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        {item.youtubeId && (
          <a
            href={`https://youtu.be/${item.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function VideosList({ pending, published, hidden }: Props) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function toggleHidden(id: string, newHidden: boolean) {
    await fetch("/api/admin/toggle-hidden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, hidden: newHidden }),
    });
    router.refresh();
  }

  async function publishVideo(id: string) {
    await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  async function syncNow() {
    setSyncing(true);
    try {
      await fetch("/api/cron/generate-divrei-tora", {
        method: "GET",
        headers: { "x-cron-secret": "" },
      });
    } finally {
      setSyncing(false);
      router.refresh();
    }
  }

  const Section = ({
    title,
    items,
    showPublish,
  }: {
    title: string;
    items: VideoItem[];
    showPublish?: boolean;
  }) =>
    items.length === 0 ? null : (
      <section className="mb-8">
        <h2 className="font-bold mb-3" style={{ color: "var(--color-primary)" }}>
          {title} ({items.length})
        </h2>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <VideoRow
              key={item._id}
              item={item}
              onToggle={toggleHidden}
              onPublish={showPublish ? publishVideo : undefined}
            />
          ))}
        </div>
      </section>
    );

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={syncNow}
          disabled={syncing}
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
          סנכרן עכשיו
        </button>
      </div>

      <Section title="ממתינים לאישור" items={pending} showPublish />
      <Section title="מפורסמים" items={published} />
      <Section title="מוסתרים מהאתר" items={hidden} />
    </div>
  );
}
