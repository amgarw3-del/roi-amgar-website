"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ExternalLink } from "lucide-react";
import type { BlogItem } from "@/app/admin/content/blog/page";

const levelLabels: Record<string, string> = {
  beginner: "מתחיל",
  advanced: "מתקדם",
  "talmidei-torah": "בני תורה",
};

export default function BlogList({
  posts,
  categories,
}: {
  posts: BlogItem[];
  categories: { _id: string; hebrewName: string }[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    bodyText: "",
    categoryId: "",
    level: "beginner",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!form.title || !form.bodyText) {
      alert("כותרת ותוכן הם שדות חובה");
      return;
    }
    setSubmitting(true);
    try {
      await fetch("/api/admin/create-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ title: "", bodyText: "", categoryId: "", level: "beginner" });
      setShowForm(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("למחוק מאמר זה?")) return;
    await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 rounded-xl font-semibold text-sm text-white"
          style={{ background: "var(--color-accent)" }}
        >
          {showForm ? "ביטול" : "+ מאמר חדש"}
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6 border-2" style={{ borderColor: "var(--color-accent)" }}>
          <h3 className="font-bold mb-4" style={{ color: "var(--color-primary)" }}>מאמר חדש</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">כותרת *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">תוכן * (פסקאות מופרדות בשורה ריקה)</label>
              <textarea
                value={form.bodyText}
                onChange={(e) => setForm((f) => ({ ...f, bodyText: e.target.value }))}
                rows={8}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-600 block mb-1">קטגוריה</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">בחר קטגוריה</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.hebrewName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">רמה</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="beginner">מתחיל</option>
                  <option value="advanced">מתקדם</option>
                  <option value="talmidei-torah">בני תורה</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-1">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="px-5 py-2 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                {submitting ? "שומר..." : "פרסם מאמר"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-xl font-medium text-sm text-gray-500 hover:bg-gray-100"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {posts.map((post) => (
          <PostRow key={post._id} post={post} onDelete={deletePost} />
        ))}
        {posts.length === 0 && (
          <p className="text-gray-400 text-sm py-4 text-center">אין מאמרים עדיין</p>
        )}
      </div>
    </div>
  );
}

function PostRow({ post, onDelete }: { post: BlogItem; onDelete: (id: string) => void }) {
  const [, startTransition] = useTransition();
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{post.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {post.category?.hebrewName ?? "—"}
          {post.level ? ` · ${levelLabels[post.level] ?? post.level}` : ""}
          {post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString("he-IL")}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={`/blog/${post._id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
        >
          <ExternalLink size={15} />
        </a>
        <button
          onClick={() => { if (confirm("למחוק?")) startTransition(() => onDelete(post._id)); }}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
