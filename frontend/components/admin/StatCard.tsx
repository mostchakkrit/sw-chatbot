import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: "primary" | "accent" | "secondary" | "success";
  delta?: { percent: number } | null;
  badge?: string;
}

const ACCENT_STYLES: Record<StatCardProps["accent"], { border: string; iconBg: string; iconColor: string }> = {
  primary: { border: "var(--color-primary)", iconBg: "color-mix(in oklab, var(--color-primary) 15%, transparent)", iconColor: "var(--color-primary)" },
  accent: { border: "var(--color-accent)", iconBg: "color-mix(in oklab, var(--color-accent) 15%, transparent)", iconColor: "var(--color-accent)" },
  secondary: { border: "var(--color-secondary)", iconBg: "color-mix(in oklab, var(--color-secondary) 25%, transparent)", iconColor: "#b8890a" },
  success: { border: "var(--color-success)", iconBg: "color-mix(in oklab, var(--color-success) 15%, transparent)", iconColor: "var(--color-success)" },
};

export default function StatCard({ icon: Icon, label, value, accent, delta, badge }: StatCardProps) {
  const style = ACCENT_STYLES[accent];
  const up = (delta?.percent ?? 0) >= 0;

  return (
    <div
      className="flex flex-col gap-4 rounded-box bg-base-100 p-5"
      style={{ boxShadow: "var(--flip7-shadow-card)", borderLeft: `3px solid ${style.border}` }}
    >
      <div className="flex items-center justify-between">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: style.iconBg, color: style.iconColor }}
        >
          <Icon size={20} />
        </span>
        {delta && (
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
              up ? "bg-success/15 text-success" : "bg-error/15 text-error"
            }`}
          >
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {up ? "+" : ""}
            {delta.percent}%
          </span>
        )}
        {badge && <span className="rounded-full bg-base-200 px-2.5 py-1 text-xs font-bold text-base-content/60">{badge}</span>}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-base-content/45">{label}</p>
        <p className="mt-1 text-3xl font-extrabold text-base-content">{value}</p>
      </div>
    </div>
  );
}
