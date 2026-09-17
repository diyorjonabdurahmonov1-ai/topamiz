import type { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand-via">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-extrabold leading-tight">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
