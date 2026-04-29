"use client";

import { useEffect } from "react";

export default function VideoTracker({ _id }: { _id: string }) {
  useEffect(() => {
    if (!_id) return;
    fetch("/api/track-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id }),
    }).catch(() => {});
  }, [_id]);
  return null;
}
