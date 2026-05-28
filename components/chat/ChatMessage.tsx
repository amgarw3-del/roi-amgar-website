"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SourceCard from "./SourceCard";
import type { ChatMessage as ChatMessageT } from "./types";

function linkifyCitations(text: string, maxId: number): string {
  if (!text || maxId < 1) return text;
  return text.replace(/\[((?:\d+\s*,\s*)*\d+)\]/g, (match, group) => {
    const ids = group
      .split(",")
      .map((s: string) => Number(s.trim()))
      .filter((n: number) => Number.isFinite(n) && n >= 1 && n <= maxId);
    if (ids.length === 0) return match;
    return ids.map((id: number) => `[[${id}]](#source-${id})`).join("");
  });
}

function handleCitationClick(e: React.MouseEvent<HTMLAnchorElement>, href?: string) {
  if (!href || !href.startsWith("#source-")) return;
  e.preventDefault();
  const id = href.slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.style.transition = "box-shadow 0.3s ease";
  target.style.boxShadow = "0 0 0 3px var(--color-ochre)";
  window.setTimeout(() => {
    target.style.boxShadow = "";
  }, 1500);
}

export default function ChatMessage({ message }: { message: ChatMessageT }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-start">
        <div
          className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: "var(--color-navy)",
            color: "var(--color-bg-paper)",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex justify-end">
      <div className="max-w-[92%] flex flex-col gap-3">
        <div
          className="rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed prose prose-sm max-w-none"
          style={{
            background: "var(--color-bg-card)",
            color: "var(--color-ink-body)",
            border: "1px solid var(--color-line-light)",
          }}
        >
          {message.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  const isCitation = href?.startsWith("#source-");
                  return (
                    <a
                      href={href}
                      onClick={isCitation ? (e) => handleCitationClick(e, href) : undefined}
                      target={isCitation ? undefined : "_blank"}
                      rel={isCitation ? undefined : "noopener noreferrer"}
                      style={{ color: "var(--color-ochre)", cursor: "pointer" }}
                      className="underline underline-offset-2 hover:opacity-80"
                    >
                      {children}
                    </a>
                  );
                },
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => (
                  <strong style={{ color: "var(--color-navy)" }}>{children}</strong>
                ),
              }}
            >
              {linkifyCitations(message.content, message.sources?.length ?? 0)}
            </ReactMarkdown>
          ) : message.pending ? (
            <span className="inline-flex gap-1 items-center" style={{ color: "var(--color-muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--color-ochre)" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:200ms]" style={{ background: "var(--color-ochre)" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:400ms]" style={{ background: "var(--color-ochre)" }} />
            </span>
          ) : null}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="space-y-2">
            <div
              className="text-[11px] font-semibold px-1 tracking-wide"
              style={{ color: "var(--color-muted)" }}
            >
              מקורות באתר:
            </div>
            {message.sources.map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
