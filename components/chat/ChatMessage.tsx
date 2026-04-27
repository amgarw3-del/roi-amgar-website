import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SourceCard from "./SourceCard";
import type { ChatMessage as ChatMessageT } from "./types";

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
                a: ({ href, children }) => (
                  <a
                    href={href}
                    style={{ color: "var(--color-ochre)" }}
                    className="underline underline-offset-2 hover:opacity-80"
                  >
                    {children}
                  </a>
                ),
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => (
                  <strong style={{ color: "var(--color-navy)" }}>{children}</strong>
                ),
              }}
            >
              {message.content}
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
