"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bot, Download, MessagesSquare, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { getAdminToken, listConversations, getStats, ConversationListItem, AdminStats } from "@/lib/adminApi";
import AdminShell from "@/components/admin/AdminShell";
import StatCard from "@/components/admin/StatCard";
import TrendChart from "@/components/admin/TrendChart";
import StatusDonut from "@/components/admin/StatusDonut";

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

const STATUS_COLOR: Record<string, string> = {
  bot_handling: "var(--color-primary)",
  escalated: "var(--color-accent)",
  resolved: "var(--color-success)",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "escalated", label: "รอเจ้าหน้าที่" },
  { value: "bot_handling", label: "บอทตอบอยู่" },
  { value: "resolved", label: "แก้ไขแล้ว" },
];

function percentChange(current: number, previous: number): { percent: number } | null {
  if (previous === 0) return null;
  return { percent: Math.round(((current - previous) / previous) * 100) };
}

function toCsv(rows: ConversationListItem[]): string {
  const header = ["customer_id", "status", "message_count", "last_message", "updated_at"];
  const lines = rows.map((c) =>
    [
      c.customerIdentifier,
      STATUS_LABEL[c.status] ?? c.status,
      c._count.messages,
      `"${(c.messages[0]?.content ?? "").replace(/"/g, '""')}"`,
      c.updatedAt,
    ].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const [convData, statsData] = await Promise.all([listConversations(status || undefined), getStats()]);
      setConversations(convData);
      setStats(statsData);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    void load(filter);
  }, [router, filter, load]);

  const visibleConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.customerIdentifier.toLowerCase().includes(q) || c.messages[0]?.content?.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  function handleExport() {
    const csv = toCsv(visibleConversations);
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalDelta = stats ? percentChange(stats.last24h.conversations, stats.last24h.previousConversations) : null;
  const donutSegments = (stats?.statusBreakdown ?? []).map((s) => ({
    label: STATUS_LABEL[s.status] ?? s.status,
    count: s.count,
    percent: s.percent,
    color: STATUS_COLOR[s.status] ?? "var(--color-neutral)",
  }));

  return (
    <AdminShell
      title="การสนทนา"
      description="ภาพรวมและรายการบทสนทนาทั้งหมดของลูกค้า"
      actions={
        <button type="button" onClick={handleExport} disabled={visibleConversations.length === 0} className="btn btn-secondary rounded-full font-bold">
          <Download size={16} /> Export CSV
        </button>
      }
    >
      {error && <div className="mb-4 rounded-box bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}

      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={MessagesSquare}
            label="การสนทนาทั้งหมด"
            value={stats.totals.conversations.toLocaleString("th-TH")}
            accent="primary"
            delta={totalDelta}
          />
          <StatCard
            icon={AlertCircle}
            label="รอเจ้าหน้าที่"
            value={stats.totals.escalated.toLocaleString("th-TH")}
            accent="accent"
            badge={stats.totals.escalated > 0 ? "ต้องดำเนินการ" : "ไม่มีคิวค้าง"}
          />
          <StatCard
            icon={Bot}
            label="บอทตอบอยู่"
            value={stats.totals.botHandling.toLocaleString("th-TH")}
            accent="secondary"
            badge={`${stats.statusBreakdown.find((s) => s.status === "bot_handling")?.percent ?? 0}% ของทั้งหมด`}
          />
          <StatCard
            icon={CheckCircle2}
            label="แก้ไขแล้ว"
            value={stats.totals.resolved.toLocaleString("th-TH")}
            accent="success"
            badge={`${stats.statusBreakdown.find((s) => s.status === "resolved")?.percent ?? 0}% ของทั้งหมด`}
          />
        </div>
      )}

      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-box bg-base-100 p-6 xl:col-span-2" style={{ boxShadow: "var(--flip7-shadow-card)" }}>
            <h2 className="text-lg font-extrabold text-base-content">แนวโน้มการสนทนา</h2>
            <p className="mb-4 text-sm text-base-content/50">จำนวนบทสนทนาที่เริ่มต้นในแต่ละวัน ช่วง 14 วันล่าสุด</p>
            <TrendChart data={stats.dailyConversations} />
          </div>
          <div className="rounded-box bg-base-100 p-6" style={{ boxShadow: "var(--flip7-shadow-card)" }}>
            <h2 className="text-lg font-extrabold text-base-content">สัดส่วนสถานะ</h2>
            <p className="mb-4 text-sm text-base-content/50">แบ่งตามสถานะบทสนทนา</p>
            <StatusDonut segments={donutSegments} total={stats.totals.conversations} />
          </div>
        </div>
      )}

      <div className="rounded-box bg-base-100 p-6" style={{ boxShadow: "var(--flip7-shadow-card)" }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-base-content">รายการล่าสุด</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="input input-sm input-bordered flex items-center gap-2 bg-base-200">
              <Search size={14} className="text-base-content/40" />
              <input
                type="text"
                placeholder="ค้นหาลูกค้าหรือข้อความ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="grow"
              />
            </label>
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
        </div>

        {loading && <p className="text-sm text-base-content/60">กำลังโหลด...</p>}

        {!loading && visibleConversations.length === 0 && (
          <div className="p-10 text-center text-base-content/50">ไม่มีการสนทนาที่ตรงกับเงื่อนไข</div>
        )}

        {!loading && visibleConversations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wide text-base-content/40">
                  <th>ลูกค้า</th>
                  <th>ข้อความล่าสุด</th>
                  <th>สถานะ</th>
                  <th className="text-right">อัปเดตล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {visibleConversations.map((c) => {
                  const lastMessage = c.messages[0];
                  const shortId = c.customerIdentifier.slice(0, 2).toUpperCase();
                  return (
                    <tr
                      key={c.id}
                      className="cursor-pointer hover:bg-base-200"
                      onClick={() => router.push(`/admin/conversations/${c.id}`)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">
                            {shortId}
                          </span>
                          <div>
                            <p className="font-bold text-base-content">{c.customerIdentifier.slice(0, 8)}</p>
                            <p className="text-xs text-base-content/45">{c._count.messages} ข้อความ</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-xs truncate text-sm text-base-content/70">{lastMessage?.content ?? "-"}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[c.status] ?? "badge-ghost"}`}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className="text-right text-sm text-base-content/50">
                        {new Date(c.updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
