import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

const PATHS: Record<string, string[]> = {
  pdfSummary: ["/sikkumim"],
  weddingGalleryImage: ["/hupot"],
  weddingTestimonial: ["/hupot"],
  lecture: ["/lectures", "/"],
  testimonial: ["/lectures"],
  lectureGalleryImage: ["/lectures"],
  lectureFaq: ["/lectures"],
  divarTora: ["/dvar-tora", "/"],
  video: ["/videos", "/"],
  blogPost: ["/blog", "/"],
  qna: ["/shaal", "/"],
  homepage: ["/"],
};

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { type } = (await req.json()) as { type?: string };
    const paths: string[] = (type && PATHS[type]) || ["/"];
    paths.forEach((p) => revalidatePath(p));
    return NextResponse.json({ ok: true, revalidated: paths });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
