"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Plus } from "lucide-react";
import { getAdminToken, listFaqs, createFaq, updateFaq, deleteFaq, Faq } from "@/lib/adminApi";
import AdminShell from "@/components/admin/AdminShell";

const EMPTY_FORM = { question: "", content: "", category: "" };

export default function AdminFaqsPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFaqs();
      setFaqs(data);
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
    void load();
  }, [router, load]);

  function startEdit(f: Faq) {
    setEditingId(f.id);
    setForm({
      question: f.question ?? "",
      content: f.content,
      category: f.category ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.content.trim()) {
      setError("กรุณากรอกคำตอบ");
      return;
    }
    setSaving(true);
    try {
      const input = {
        question: form.question.trim() || null,
        content: form.content.trim(),
        category: form.category.trim() || null,
      };
      if (editingId) {
        await updateFaq(editingId, input);
      } else {
        await createFaq(input);
      }
      cancelEdit();
      await load();
    } catch {
      setError("บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบ FAQ นี้ใช่หรือไม่?")) return;
    try {
      await deleteFaq(id);
      if (editingId === id) cancelEdit();
      await load();
    } catch {
      setError("ลบข้อมูลไม่สำเร็จ");
    }
  }

  return (
    <AdminShell title="จัดการ FAQ" description="คลังคำถาม-คำตอบที่บอทใช้อ้างอิงเวลาตอบลูกค้า">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-box bg-base-100 p-4"
          style={{ boxShadow: "var(--flip7-shadow-card)" }}
        >
          <h2 className="font-bold text-base-content">{editingId ? "แก้ไข FAQ" : "เพิ่ม FAQ ใหม่"}</h2>
          <input
            className="input input-bordered w-full"
            placeholder='คำถามลูกค้า เช่น "สินค้าผลิตวันที่เท่าไหร่"'
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder='คำตอบที่บอทจะใช้ตอบ เช่น "สินค้าผลิตวันที่ 1/1/2569"'
            rows={2}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <input
            className="input input-bordered w-full"
            placeholder="หมวดหมู่ (ไม่บังคับ) เช่น shipping, warranty"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              <Plus size={16} /> {editingId ? "บันทึกการแก้ไข" : "เพิ่ม FAQ"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                ยกเลิก
              </button>
            )}
          </div>
        </form>

        {loading && <p className="text-sm text-base-content/60">กำลังโหลด...</p>}

        {!loading && faqs.length === 0 && (
          <div
            className="rounded-box bg-base-100 p-8 text-center text-base-content/60"
            style={{ boxShadow: "var(--flip7-shadow-card)" }}
          >
            ยังไม่มี FAQ
          </div>
        )}

        <div className="flex flex-col gap-3">
          {faqs.map((f) => (
            <div
              key={f.id}
              className="flex flex-col gap-2 rounded-box bg-base-100 p-4"
              style={{ boxShadow: "var(--flip7-shadow-card)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-base-content">
                  {f.question ?? "(ไม่มีคำถามระบุ)"}
                  {f.category && <span className="ml-2 text-xs font-normal text-base-content/50">#{f.category}</span>}
                </span>
                <div className="flex gap-1">
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => startEdit(f)}>
                    <Pencil size={14} />
                  </button>
                  <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(f.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-base-content/70">{f.content}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
