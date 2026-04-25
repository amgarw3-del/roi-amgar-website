import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { sendDvarToraForApproval } from "@/lib/send-email";

export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  `https://${process.env.VERCEL_URL}` ||
  "http://localhost:3000";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    token: process.env.SANITY_API_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  try {
    const pending = await sanity.fetch<
      Array<{ _id: string; title: string; teaser: string; content: string; category?: { slug: { current: string } } }>
    >(
      `*[_type == "divarTora" && status == "draft" && sourceType == "uploaded" && !defined(emailedAt)]
       | order(_createdAt asc)[0...3] {
         _id, title, teaser, content, category->{slug}
       }`
    );

    if (pending.length === 0) {
      return NextResponse.json({ sent: 0, message: "אין טיוטות ממתינות" });
    }

    const approvalSecret = process.env.APPROVAL_SECRET;
    const items = pending.map((d) => ({
      title: d.title,
      teaser: d.teaser,
      content: d.content,
      category: d.category?.slug?.current ?? "כללי",
      approveUrl: approvalSecret
        ? `${BASE_URL}/api/approve-dvar?id=${d._id}&token=${approvalSecret}`
        : undefined,
    }));

    await sendDvarToraForApproval(items);

    await Promise.all(
      pending.map((d) =>
        sanity
          .patch(d._id)
          .set({ emailedAt: new Date().toISOString() })
          .commit()
      )
    );

    return NextResponse.json({ sent: pending.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
