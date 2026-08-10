"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, AdminApiError, getAdminToken, setAdminToken } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminToken()) router.replace("/admin/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      setAdminToken(res.token);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-base-200 px-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-box bg-base-100 p-8"
        style={{ boxShadow: "var(--flip7-shadow-card)" }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-base-content">🎧 Admin Login</h1>
          <p className="mt-1 text-sm text-base-content/60">SoundWave Pro Support Dashboard</p>
        </div>

        {error && <div className="rounded-box bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-base-content/70">อีเมล</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full"
            placeholder="admin@soundwave.local"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-base-content/70">รหัสผ่าน</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered w-full"
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary mt-2 rounded-full font-bold"
          style={{ boxShadow: "var(--flip7-shadow-teal-glow)" }}
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}
