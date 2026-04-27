"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatSource } from "./types";

const STORAGE_KEY = "roi-amgar-chat-v1";

interface ChatEvent {
  type: "sources" | "delta" | "done" | "error";
  sources?: ChatSource[];
  text?: string;
  message?: string;
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {}
  }, []);

  // Persist on change (skip if streaming to avoid spam)
  useEffect(() => {
    if (isStreaming) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, isStreaming]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      const userMsg: ChatMessage = { id: newId(), role: "user", content: trimmed };
      const assistantMsg: ChatMessage = {
        id: newId(),
        role: "assistant",
        content: "",
        pending: true,
      };

      const baseHistory = [...messages, userMsg];
      setMessages([...baseHistory, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: baseHistory.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let evt: ChatEvent;
            try {
              evt = JSON.parse(line);
            } catch {
              continue;
            }

            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMsg.id) return m;
                if (evt.type === "sources") {
                  return { ...m, sources: evt.sources, pending: !m.content };
                }
                if (evt.type === "delta" && evt.text) {
                  return { ...m, content: m.content + evt.text, pending: false };
                }
                if (evt.type === "done") {
                  return { ...m, pending: false };
                }
                if (evt.type === "error") {
                  return {
                    ...m,
                    pending: false,
                    content: m.content || "אירעה שגיאה. נסה שוב.",
                  };
                }
                return m;
              })
            );

            if (evt.type === "error") setError(evt.message ?? "שגיאה");
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "שגיאה";
        if (message !== "AbortError") {
          setError(message);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, pending: false, content: "אירעה שגיאה. נסה שוב." }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return { messages, isStreaming, error, send, reset };
}
