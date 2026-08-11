"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, UserRoundCheck, X } from "lucide-react";
import { parseSseStream } from "@/lib/sse";

const API_URL = "/api";

interface ChatMessage {
  sender: "customer" | "bot" | "admin";
  text: string;
}

const CONVERSATION_ID_KEY = "chatbot-demo-conversation-id";

function getCustomerIdentifier(): string {
  const key = "chatbot-demo-customer-id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

interface ChatWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChatWidget({ open, onOpenChange }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    return () => eventSourceRef.current?.close();
  }, []);

  useEffect(() => {
    const storedId = window.localStorage.getItem(CONVERSATION_ID_KEY);
    if (!storedId) return;

    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/chat/${storedId}/history?customerIdentifier=${encodeURIComponent(getCustomerIdentifier())}`,
        );
        if (!res.ok) {
          window.localStorage.removeItem(CONVERSATION_ID_KEY);
          return;
        }
        const data = (await res.json()) as {
          conversationId: string;
          status: string;
          messages: { sender: "customer" | "bot" | "admin"; content: string }[];
        };
        conversationId.current = data.conversationId;
        setMessages(data.messages.map((m) => ({ sender: m.sender, text: m.content })));
        setEscalated(data.status === "escalated");
        subscribeToAdminReplies(data.conversationId);
      } catch {
        // ignore — customer just starts a fresh conversation
      }
    })();
  }, []);

  function subscribeToAdminReplies(id: string) {
    if (eventSourceRef.current) return;
    const es = new EventSource(`${API_URL}/chat/${id}/stream`);
    es.addEventListener("admin-message", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { content: string };
      setMessages((prev) => [...prev, { sender: "admin", text: data.content }]);
      setEscalated(false);
    });
    eventSourceRef.current = es;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    setMessages((prev) => [...prev, { sender: "customer", text }]);
    setInput("");
    setIsStreaming(true);

    let botText = "";
    setMessages((prev) => [...prev, { sender: "bot", text: "" }]);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerIdentifier: getCustomerIdentifier(),
          conversationId: conversationId.current,
          message: text,
        }),
      });

      if (!res.body) throw new Error("No response body");

      for await (const evt of parseSseStream(res.body)) {
        if (evt.event === "start") {
          const id = JSON.parse(evt.data).conversationId as string;
          conversationId.current = id;
          window.localStorage.setItem(CONVERSATION_ID_KEY, id);
          subscribeToAdminReplies(id);
        } else if (evt.event === "escalate") {
          setEscalated(true);
        } else if (evt.event === "error") {
          botText += "\n[เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง]";
        } else if (evt.event === "message") {
          botText += JSON.parse(evt.data).text;
        }
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { sender: "bot", text: botText };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { sender: "bot", text: "ขอโทษค่ะ เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง" };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="flex h-[32rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-box bg-base-100"
          style={{ boxShadow: "var(--flip7-shadow-teal-glow)" }}
        >
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-content">
            <div>
              <p className="font-extrabold">ผู้ช่วยร้าน SoundWave</p>
              <p className="text-xs opacity-80">ถามได้ตลอด 24 ชม.</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn btn-circle btn-sm btn-ghost text-primary-content"
              aria-label="ปิดแชท"
            >
              <X size={16} />
            </button>
          </div>

          {escalated && (
            <div className="badge badge-accent m-2 self-center gap-1 py-3">
              <UserRoundCheck size={14} /> กำลังส่งต่อให้เจ้าหน้าที่
            </div>
          )}

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-base-content/60">
                สวัสดีค่ะ 👋 สอบถามเรื่องหูฟัง SoundWave Pro ได้เลยนะคะ
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat ${m.sender === "customer" ? "chat-end" : "chat-start"}`}>
                {m.sender === "admin" && (
                  <div className="chat-header text-xs text-base-content/50">เจ้าหน้าที่</div>
                )}
                <div
                  className={`chat-bubble ${
                    m.sender === "customer"
                      ? "chat-bubble-primary"
                      : m.sender === "admin"
                        ? "chat-bubble-accent"
                        : "bg-[var(--flip7-cream)] text-base-content"
                  }`}
                >
                  {m.text || (isStreaming && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-base-300 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์คำถามที่นี่..."
              className="input input-bordered flex-1 rounded-full bg-[var(--flip7-cream)]"
              disabled={isStreaming}
            />
            <button
              type="submit"
              className="btn btn-secondary rounded-full"
              disabled={isStreaming || !input.trim()}
              style={{ boxShadow: "var(--flip7-shadow-accent-glow)" }}
            >
              ส่ง
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="btn btn-circle btn-primary btn-lg"
        style={{ boxShadow: "var(--flip7-shadow-teal-glow)" }}
        aria-label={open ? "ปิดแชท" : "เปิดแชท"}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
