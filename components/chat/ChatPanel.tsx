"use client";

import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import { useChat } from "./useChat";

const SUGGESTIONS = [
  "דברי תורה לפרשת השבוע",
  "שיעורים על אמונה",
  "מה אומר הרב על תפילה?",
  "איך לשאול שאלה לרב?",
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
      className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:left-6 sm:right-auto sm:w-[400px] sm:h-[600px] sm:max-h-[85vh] z-[60] flex flex-col bg-slate-50 sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-chat-enter"
      role="dialog"
      aria-label="עוזר חיפוש האתר"
      dir="rtl"
    >
      <header className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-l from-amber-700 to-amber-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full" aria-hidden />
          <div>
            <div className="font-semibold text-sm leading-tight">עוזר האתר</div>
            <div className="text-[11px] opacity-80 leading-tight">
              חיפוש בשיעורים, דברי תורה ומאמרים
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="text-xs px-2 py-1 rounded hover:bg-white/15 transition"
              aria-label="שיחה חדשה"
              title="שיחה חדשה"
            >
              שיחה חדשה
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition"
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
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-2xl mb-2">📖</div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">
                שלום! איך אפשר לעזור?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                אני אעזור לך למצוא שיעורים, דברי תורה ומאמרים של הרב באתר.
                <br />
                <span className="text-slate-400">
                  לשאלה הלכתית מעשית — שלח דרך &quot;שאל את הרב&quot;.
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-[11px] text-slate-500 font-medium px-1">שאלות לדוגמה:</div>
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  className="block w-full text-right text-sm px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} message={m} />)
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 bg-white p-3 flex gap-2 shrink-0"
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
          className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 max-h-32"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="shrink-0 w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="שלח"
        >
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <path d="M16 4L4 10l5 2 2 5 5-13z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" fill="none" transform="scale(-1,1) translate(-20,0)" />
          </svg>
        </button>
      </form>
    </div>
  );
}
