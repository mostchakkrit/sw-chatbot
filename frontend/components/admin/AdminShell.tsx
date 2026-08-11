"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Headphones, MessagesSquare, MessageCircleQuestion, LogOut } from "lucide-react";
import { clearAdminToken, getAdminUser, AdminUser } from "@/lib/adminApi";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "การสนทนา", icon: MessagesSquare },
  { href: "/admin/faqs", label: "จัดการ FAQ", icon: MessageCircleQuestion },
];

export default function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    setUser(getAdminUser());
  }, []);

  function handleLogout() {
    clearAdminToken();
    router.push("/admin/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  return (
    <div className="flex min-h-dvh flex-col bg-base-200 lg:flex-row">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between gap-3 bg-base-100 px-4 py-3 lg:hidden" style={{ boxShadow: "var(--flip7-shadow-card)" }}>
        <p className="flex items-center gap-2 font-extrabold text-base-content">
          <Headphones size={18} className="text-primary" /> SoundWave
        </p>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  active ? "bg-primary text-primary-content" : "text-base-content/60 hover:bg-base-200"
                }`}
              >
                <Icon size={17} />
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="ออกจากระบบ"
            className="flex h-9 w-9 items-center justify-center rounded-full text-base-content/60 transition hover:bg-base-200"
          >
            <LogOut size={17} />
          </button>
        </nav>
      </header>

      {/* Desktop sidebar */}
      <aside
        className="hidden w-64 shrink-0 flex-col justify-between bg-base-100 p-5 lg:sticky lg:top-0 lg:flex lg:h-dvh"
        style={{ boxShadow: "var(--flip7-shadow-card)" }}
      >
        <div className="flex flex-col gap-8">
          <div>
            <p className="flex items-center gap-2 text-lg font-extrabold text-base-content">
              <Headphones size={20} className="text-primary" /> SoundWave
            </p>
            <p className="text-xs font-bold uppercase tracking-wide text-base-content/40">Support Admin</p>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                    active ? "bg-primary text-primary-content" : "text-base-content/60 hover:bg-base-200"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-base-200 pt-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-base-content">{user?.name ?? "เจ้าหน้าที่"}</p>
              <p className="truncate text-xs text-base-content/50">{user?.email ?? ""}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-base-content/60 transition hover:bg-base-200"
          >
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-8 sm:py-7">
          <div>
            <h1 className="text-2xl font-extrabold text-base-content sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-base-content/60">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>

        <main className="flex-1 px-4 pb-10 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
