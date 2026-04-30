"use client";

import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import { useChat } from "./useChat";

const SUGGESTIONS = [
  "דברי תורה לפרשת השבוע",
  "שיעורים על אמונה",
  "יש הרצאות לאירועים?",
  "סיכומי הלכה להורדה",
];

const QUICK_ACTIONS = [
  { emoji: "💍", label: "חופה",   url: "/hupot" },
  { emoji: "🎤", label: "הרצאה",  url: "/lectures" },
  { emoji: "✉️", label: "שאלה",   url: "/shaal" },
  { emoji: "📥", label: "סיכומים", url: "/sikkumim" },
];

interface Props {
  onClose: () => void;
}

export default function ChatPanel({ onClose }: Props) {
  const { messages, isStreaming, send, reset } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    send(input);
    setInput("");
  };

  const handleSuggestion = (q: string) => {
    if (isStreaming) return;
    send(q);
  };

  return (
    <div
      className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:left-6 sm:right-auto sm:w-[400px] sm:h-[620px] sm:max-h-[85vh] z-[60] flex flex-col sm:rounded-2xl overflow-hidden animate-chat-enter"
      style={{
        background: "var(--color-bg-hero)",
        border: "1px solid var(--color-line)",
        boxShadow: "0 24px 60px rgba(15, 23, 41, 0.22)",
      }}
      role="dialog"
      aria-label="עוזר חיפוש האתר"
      dir="rtl"
    >
      <header
        className="flex items-center justify-between gap-2 px-4 py-3 shrink-0"
        style={{
          background:
            "linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-deep) 100%)",
          color: "var(--color-bg-paper)",
          borderBottom: "1px solid rgba(168, 106, 44, 0.4)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "rgba(168, 106, 44, 0.2)",
              border: "1px solid rgba(168, 106, 44, 0.45)",
            }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M4 7l8-4 8 4-8 4-8-4z" stroke="var(--color-ochre-light)" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M4 12l8 4 8-4" stroke="var(--color-ochre-light)" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M4 17l8 4 8-4" stroke="var(--color-ochre-light)" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <div
              className="font-bold text-base leading-tight"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              עוזר האתר
            </div>
            <div className="text-[11px] opacity-75 leading-tight">
              חיפוש בשיעורים, דברי תורה ומאמרים
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{
                color: "var(--color-bg-paper)",
                background: "rgba(255, 255, 255, 0.08)",
              }}
              aria-label="שיחה חדשה"
              title="שיחה חדשה"
            >
              שיחה חדשה
            </button>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-white/15"
            aria-label="סגור"
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-5">
            <div className="text-center py-2">
              <div className="inline-flex w-14 h-14 mb-3 rounded-full items-center justify-center"
                style={{ background: "var(--color-bg-cream)", border: "1px solid var(--color-line)" }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                  <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14l-4-3H6a2 2 0 0 1-2-2V5z" stroke="var(--color-navy)" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M8 9h8M8 12h5" stroke="var(--color-ochre)" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <h3
                className="text-lg leading-tight mb-1"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--color-navy)",
                  fontWeight: 700,
                }}
              >
                שלום! איך אפשר לעזור?
              </h3>
              <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: "var(--color-muted)" }}>
                אעזור לך למצוא שיעורים, דברי תורה ומאמרים של הרב.
                <br />
                לשאלה הלכתית מעשית — שלח דרך &quot;שאל את הרב&quot;.
              </p>
            </div>
            <div className="space-y-2">
              <div
                className="text-[11px] font-semibold px-1 tracking-wide"
                style={{ color: "var(--color-muted)" }}
              >
                שאלות לדוגמה:
              </div>
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  className="block w-full text-right text-sm px-3.5 py-2.5 rounded-xl transition-all"
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-line-light)",
                    color: "var(--color-ink-body)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-ochre)";
                    e.currentTarget.style.background = "var(--color-bg-paper)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-line-light)";
                    e.currentTarget.style.background = "var(--color-bg-card)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <div
                className="text-[11px] font-semibold px-1 tracking-wide"
                style={{ color: "var(--color-muted)" }}
              >
                ניווט מהיר:
              </div>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_ACTIONS.map((a) => (
                  <a
                    key={a.url}
                    href={a.url}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl transition-all text-center"
                    style={{
                      background: "var(--color-bg-card)",
                      border: "1px solid var(--color-line-light)",
                      color: "var(--color-ink-body)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-ochre)";
                      e.currentTarget.style.background = "rgba(168, 106, 44, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-line-light)";
                      e.currentTarget.style.background = "var(--color-bg-card)";
                    }}
                  >
                    <span className="text-xl" aria-hidden>{a.emoji}</span>
                    <span className="text-[11px] font-semibold">{a.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} message={m} />)
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 flex gap-2 shrink-0"
        style={{
          borderTop: "1px solid var(--color-line)",
          background: "var(--color-bg-card)",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={1}
          placeholder="שאל אותי על תוכן באתר..."
          className="flex-1 resize-none rounded-lg px-3 py-2 text-sm focus:outline-none max-h-32"
          style={{
            border: "1px solid var(--color-line)",
            background: "var(--color-bg-hero)",
            color: "var(--color-ink-body)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-ochre)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(168, 106, 44, 0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-line)";
            e.currentTarget.style.boxShadow = "none";
          }}
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--color-navy)",
            color: "var(--color-bg-paper)",
          }}
          aria-label="שלח"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden>
            {/* Right-pointing send icon (RTL: visually points to start of message direction) */}
            <path
              d="M20 12L4 4l3 8-3 8 16-8z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              fill="none"
              transform="scale(-1,1) translate(-24,0)"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
