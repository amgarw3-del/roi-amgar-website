import { NextRequest, NextResponse } from "next/server";
import { client, queries } from "@/sanity/client";
import { generateDvarDocx } from "@/lib/generate-dvar-docx";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const item = await client
    .fetch(queries.divarToraBySlug(slug))
    .catch(() => null);

  if (!item) {
    return new NextResponse("לא נמצא", { status: 404 });
  }

  const content = item.content ?? item.teaser ?? "";
  const buf = await generateDvarDocx(item.title, content);
  const filename = encodeURIComponent(`${item.title}.docx`);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
