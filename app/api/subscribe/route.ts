import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email } = await req.json();
    if (!name || !email) {
      return NextResponse.json({ error: "חסרים פרטים" }, { status: 400 });
    }

    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
    const token = process.env.SANITY_API_TOKEN!;

    const mutations = [{
      create: {
        _type: "subscriber",
        name,
        phone: phone ?? "",
        email,
        createdAt: new Date().toISOString(),
      }
    }];

    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2021-06-07/data/mutate/${dataset}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutations }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Sanity error:", err);
      return NextResponse.json({ error: "שגיאה בשמירה" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
