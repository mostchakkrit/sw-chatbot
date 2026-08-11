import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: "primary" | "accent" | "info";
}

const accentBorder: Record<NonNullable<FeatureCardProps["accent"]>, string> = {
  primary: "border-l-primary",
  accent: "border-l-accent",
  info: "border-l-info",
};

const accentIconBg: Record<NonNullable<FeatureCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  info: "bg-info/10 text-info",
};

export default function FeatureCard({ icon: Icon, title, description, accent = "primary" }: FeatureCardProps) {
  return (
    <div
      className={`rounded-box border-l-[6px] bg-base-100 p-3 ${accentBorder[accent]}`}
      style={{ boxShadow: "var(--flip7-shadow-card)" }}
    >
      <div className={`mb-1.5 flex h-9 w-9 items-center justify-center rounded-full ${accentIconBg[accent]}`}>
        <Icon size={20} strokeWidth={2.25} />
      </div>
      <h3 className="font-bold text-base-content">{title}</h3>
      <p className="mt-1 text-sm text-base-content/70">{description}</p>
    </div>
  );
}
