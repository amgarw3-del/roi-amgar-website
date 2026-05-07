import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

function csvEscape(v: string) {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const subs = await sanity.fetch<{
    name?: string; email: string; phone?: string; createdAt?: string;
  }[]>(`*[_type == "subscriber" && defined(email)] | order(createdAt desc) {
    name, email, phone, createdAt
  }`);

  const rows = [
    ["שם", "אימייל", "טלפון", "תאריך הרשמה"],
    ...subs.map((s) => [
      s.name ?? "",
      s.email,
      s.phone ?? "",
      s.createdAt ? new Date(s.createdAt).toLocaleDateString("he-IL") : "",
    ]),
  ];
  const csv = "﻿" + rows.map((r) => r.map((c) => csvEscape(c)).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
