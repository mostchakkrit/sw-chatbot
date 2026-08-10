"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AdminApiError,
  ConversationDetail,
  getAdminToken,
  getConversation,
  replyToConversation,
} from "@/lib/adminApi";

const SENDER_LABEL: Record<string, string> = {
  customer: "ลูกค้า",
  bot: "บอท",
  admin: "เจ้าหน้าที่",
};

export default function AdminConversationDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const conversationId = params.id;

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await getConversation(conversationId);
      setConversation(data);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    void load();
  }, [router, load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    const content = reply.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    try {
      const updated = await replyToConversation(conversationId, content);
      setConversation(updated);
      setReply("");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "ส่งข้อความไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-base-200">
      <header className="flex items-center gap-3 bg-primary px-6 py-4 text-primary-content">
        <Link href="/admin/dashboard" className="btn btn-sm btn-ghost text-primary-content">
          ← กลับ
        </Link>
        <h1 className="text-lg font-extrabold">
          บทสนทนา {conversation ? `· ${conversation.customerIdentifier.slice(0, 8)}` : ""}
        </h1>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-6">
        {loading && <p className="text-sm text-base-content/60">กำลังโหลด...</p>}
        {error && <div className="rounded-box bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}

        {conversation && (
          <>
            <div
              ref={scrollRef}
              className="flex max-h-[28rem] flex-1 flex-col gap-2 overflow-y-auto rounded-box bg-base-100 p-4"
              style={{ boxShadow: "var(--flip7-shadow-card)" }}
            >
              {conversation.messages.map((m) => (
                <div key={m.id} className={`chat ${m.sender === "customer" ? "chat-start" : "chat-end"}`}>
                  <div className="chat-header text-xs text-base-content/50">{SENDER_LABEL[m.sender] ?? m.sender}</div>
                  <div
                    className={`chat-bubble ${
                      m.sender === "customer"
                        ? "bg-[var(--flip7-cream)] text-base-content"
                        : m.sender === "admin"
                          ? "chat-bubble-secondary"
                          : "chat-bubble-primary"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            {conversation.status === "escalated" ? (
              <form
                onSubmit={handleReply}
                className="flex gap-2 rounded-box bg-base-100 p-3"
                style={{ boxShadow: "var(--flip7-shadow-card)" }}
              >
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="พิมพ์คำตอบถึงลูกค้า..."
                  className="textarea textarea-bordered flex-1 bg-[var(--flip7-cream)]"
                  rows={2}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="btn btn-secondary rounded-full"
                  style={{ boxShadow: "var(--flip7-shadow-accent-glow)" }}
                >
                  ส่ง
                </button>
              </form>
            ) : (
              <div className="rounded-box bg-base-100 p-3 text-center text-sm text-base-content/60">
                {conversation.status === "resolved" ? "บทสนทนานี้แก้ไขเรียบร้อยแล้ว" : "บอทกำลังดูแลบทสนทนานี้อยู่"}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
