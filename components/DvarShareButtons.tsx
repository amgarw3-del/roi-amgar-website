"use client";

import ShareButtons from "./ShareButtons";

interface Props {
  title: string;
  slug: string;
}

export default function DvarShareButtons({ title, slug }: Props) {
  return <ShareButtons title={title} path={`/dvar-tora/${encodeURIComponent(slug)}`} />;
}
