import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SourceCard from "./SourceCard";
import type { ChatMessage as ChatMessageT } from "./types";

export default function ChatMessage({ message }: { message: ChatMessageT }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] bg-amber-600 text-white rounded-2xl rounded-bl-sm px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex justify-end">
      <div className="max-w-[92%] flex flex-col gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed text-slate-900 prose prose-sm prose-slate max-w-none">
          {message.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
                  >
                    {children}
                  </a>
                ),
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : message.pending ? (
            <span className="inline-flex gap-1 items-center text-slate-400">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:200ms]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:400ms]" />
            </span>
          ) : null}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-500 font-medium px-1">מקורות באתר:</div>
            {message.sources.map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
