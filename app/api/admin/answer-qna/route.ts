import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { revalidatePath } from "next/cache";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

function slugify(input: string): string {
  // Hebrew-friendly slugify: keep Hebrew letters, replace whitespace/punct with hyphen.
  return input
    .trim()
    .replace(/["׳״'`.,?!:;()\[\]{}<>]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

async function ensureUniqueSlug(base: string, currentId: string): Promise<string> {
  let candidate = base || `qna-${Date.now()}`;
  for (let i = 0; i < 10; i++) {
    const taken = await sanity.fetch<string | null>(
      `*[_type == "qna" && slug.current == $s && _id != $id][0]._id`,
      { s: candidate, id: currentId }
    );
    if (!taken) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  const { id, answer, publish } = (await req.json()) as {
    id: string;
    answer?: string;
    publish?: boolean;
  };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch = sanity.patch(id);
  if (answer !== undefined) patch.set({ answer });

  if (publish !== undefined) {
    patch.set({
      isPublic: publish,
      publishedAt: publish ? new Date().toISOString() : undefined,
    });

    if (publish) {
      const doc = await sanity.fetch<{ question?: string; slug?: { current?: string } } | null>(
        `*[_type == "qna" && _id == $id][0]{ question, slug }`,
        { id }
      );
      if (doc && !doc.slug?.current && doc.question) {
        const unique = await ensureUniqueSlug(slugify(doc.question), id);
        patch.set({ slug: { _type: "slug", current: unique } });
      }
    }
  }

  const result = await patch.commit();

  if (publish !== undefined) {
    revalidatePath("/");
    revalidatePath("/shaal");
    const slug = (result as { slug?: { current?: string } }).slug?.current;
    if (slug) revalidatePath(`/shaal/${slug}`);
  }

  return NextResponse.json({ ok: true });
}
