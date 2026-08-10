interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  accent?: "primary" | "accent" | "info";
}

const accentBorder: Record<NonNullable<FeatureCardProps["accent"]>, string> = {
  primary: "border-l-primary",
  accent: "border-l-accent",
  info: "border-l-info",
};

export default function FeatureCard({ icon, title, description, accent = "primary" }: FeatureCardProps) {
  return (
    <div
      className={`rounded-box border-l-[6px] bg-base-100 p-4 ${accentBorder[accent]}`}
      style={{ boxShadow: "var(--flip7-shadow-card)" }}
    >
      <div className="mb-2 text-2xl">{icon}</div>
      <h3 className="font-bold text-base-content">{title}</h3>
      <p className="mt-1 text-sm text-base-content/70">{description}</p>
    </div>
  );
}
