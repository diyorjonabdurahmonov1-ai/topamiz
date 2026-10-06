import { type LucideIcon } from "lucide-react";

// A standalone quick-access card for one of the home page's Lost/Found
// tabs — shown filled with its gradient when selected, outlined and muted
// when not, so Lost and Found read as two separate, equally-visible
// choices instead of one toggle where the other option is hidden behind it.
export default function HomeTabCard({
  active,
  label,
  icon: Icon,
  gradient,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "card-hover flex min-h-[120px] flex-col items-center justify-center gap-1.5 rounded-2xl text-white shadow-lg"
          : "card-hover flex min-h-[120px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface-2 text-muted hover:text-foreground"
      }
      style={active ? { backgroundImage: gradient } : undefined}
    >
      <Icon className="h-5 w-5" strokeWidth={2.25} />
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
