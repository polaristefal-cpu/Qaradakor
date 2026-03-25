// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({
  icon: Icon,
  label,
  iconClass = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-0.5 h-5 rounded-full bg-primary" />
      <Icon className={`w-4.5 h-4.5 ${iconClass}`} />
      <h2 className="text-lg font-bold text-foreground tracking-tight">{label}</h2>
    </div>
  );
}
