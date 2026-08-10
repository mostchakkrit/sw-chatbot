"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearAdminToken, getAdminToken, listConversations, ConversationListItem } from "@/lib/adminApi";

const STATUS_LABEL: Record<string, string> = {
  bot_handling: "บอทตอบอยู่",
  escalated: "รอเจ้าหน้าที่",
  resolved: "แก้ไขแล้ว",
};

const STATUS_BADGE: Record<string, string> = {
  bot_handling: "badge-info",
  escalated: "badge-accent",
  resolved: "badge-success",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "escalated", label: "รอเจ้าหน้าที่" },
  { value: "bot_handling", label: "บอทตอบอยู่" },
  { value: "resolved", label: "แก้ไขแล้ว" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("escalated");
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (status: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await listConversations(status || undefined);
        setConversations(data);
      } catch {
        setError("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    void load(filter);
  }, [router, filter, load]);

  function handleLogout() {
    clearAdminToken();
    router.push("/admin/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-base-200">
      <header className="flex items-center justify-between bg-primary px-6 py-4 text-primary-content">
        <h1 className="text-xl font-extrabold">🎧 Support Dashboard</h1>
        <button type="button" onClick={handleLogout} className="btn btn-sm btn-ghost text-primary-content">
          ออกจากระบบ
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`btn btn-sm rounded-full ${filter === f.value ? "btn-primary" : "btn-ghost"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && <div className="rounded-box bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}
        {loading && <p className="text-sm text-base-content/60">กำลังโหลด...</p>}

        {!loading && conversations.length === 0 && (
          <div
            className="rounded-box bg-base-100 p-8 text-center text-base-content/60"
            style={{ boxShadow: "var(--flip7-shadow-card)" }}
          >
            ไม่มีการสนทนาในหมวดนี้
          </div>
        )}

        <div className="flex flex-col gap-3">
          {conversations.map((c) => {
            const lastMessage = c.messages[0];
            return (
              <Link
                key={c.id}
                href={`/admin/conversations/${c.id}`}
                className="flex flex-col gap-2 rounded-box bg-base-100 p-4 transition hover:-translate-y-0.5"
                style={{ boxShadow: "var(--flip7-shadow-card)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base-content">ลูกค้า: {c.customerIdentifier.slice(0, 8)}</span>
                  <span className={`badge ${STATUS_BADGE[c.status] ?? "badge-ghost"}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
                {lastMessage && (
                  <p className="truncate text-sm text-base-content/70">
                    {lastMessage.sender === "customer" ? "👤" : lastMessage.sender === "admin" ? "🧑‍💼" : "🤖"}{" "}
                    {lastMessage.content}
                  </p>
                )}
                <span className="text-xs text-base-content/50">
                  {c._count.messages} ข้อความ · อัปเดตล่าสุด {new Date(c.updatedAt).toLocaleString("th-TH")}
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
