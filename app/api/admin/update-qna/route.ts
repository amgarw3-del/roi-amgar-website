import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

function refOf(id: string, key?: string) {
  return { _type: "reference" as const, _ref: id, _key: key ?? id };
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = (await req.json()) as {
    id: string;
    question?: string;
    answer?: string;
    categoryIds?: string[];
    subTopicIds?: string[];
    isPublic?: boolean;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const set: Record<string, unknown> = {};
  const unset: string[] = [];

  if (body.question !== undefined) set.question = body.question;
  if (body.answer !== undefined) set.answer = body.answer;

  if (body.categoryIds !== undefined) {
    const [primary, ...extras] = body.categoryIds;
    if (primary) {
      set.category = refOf(primary);
    } else {
      unset.push("category");
    }
    if (extras.length > 0) {
      set.extraCategories = extras.map((id) => refOf(id));
    } else {
      unset.push("extraCategories");
    }
  }

  if (body.subTopicIds !== undefined) {
    if (body.subTopicIds.length > 0) {
      set.subTopics = body.subTopicIds.map((id) => refOf(id));
    } else {
      unset.push("subTopics");
    }
  }

  if (body.isPublic !== undefined) {
    set.isPublic = body.isPublic;
    set.publishedAt = body.isPublic ? new Date().toISOString() : undefined;
  }

  let patch = sanity.patch(body.id);
  if (Object.keys(set).length > 0) patch = patch.set(set);
  if (unset.length > 0) patch = patch.unset(unset);

  const result = await patch.commit();

  revalidatePath("/");
  revalidatePath("/shaal");
  const slug = (result as { slug?: { current?: string } }).slug?.current;
  if (slug) revalidatePath(`/shaal/${slug}`);

  return NextResponse.json({ ok: true });
}
