import { PackageSearch, Search, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export type HomeTabKey = "lost" | "found";

const TAB_META: Record<
  HomeTabKey,
  { label: (dict: Dictionary) => string; icon: LucideIcon; gradient: string }
> = {
  lost: {
    label: (dict) => dict.tabs.lost,
    icon: Search,
    gradient: "linear-gradient(135deg, var(--danger), var(--accent-gold-2))",
  },
  found: {
    label: (dict) => dict.tabs.found,
    icon: PackageSearch,
    gradient: "linear-gradient(135deg, var(--success), var(--brand-to))",
  },
};

// A compact "stack of tabs" control — the inactive tab peeks out as a thin
// strip above the active one, like a folder tab, so switching Lost/Found
// takes no more room than a single quick-access card.
export default function LostFoundTabCard({
  active,
  onChange,
  dict,
}: {
  active: HomeTabKey;
  onChange: (tab: HomeTabKey) => void;
  dict: Dictionary;
}) {
  const inactiveKey: HomeTabKey = active === "lost" ? "found" : "lost";
  const activeMeta = TAB_META[active];
  const inactiveMeta = TAB_META[inactiveKey];
  const ActiveIcon = activeMeta.icon;
  const InactiveIcon = inactiveMeta.icon;

  return (
    <div className="relative min-h-[120px]">
      <button
        type="button"
        onClick={() => onChange(inactiveKey)}
        className="absolute inset-x-3 top-0 flex h-7 items-center justify-center gap-1 rounded-t-xl text-[10px] font-bold text-white"
        style={{ backgroundImage: inactiveMeta.gradient }}
      >
        <InactiveIcon className="h-3 w-3" strokeWidth={2.5} />
        {inactiveMeta.label(dict)}
      </button>
      <div
        className="card-hover absolute inset-x-0 bottom-0 top-5 flex flex-col items-center justify-center gap-1.5 rounded-2xl text-white shadow-lg"
        style={{ backgroundImage: activeMeta.gradient }}
      >
        <ActiveIcon className="h-5 w-5" strokeWidth={2.25} />
        <span className="text-sm font-bold">{activeMeta.label(dict)}</span>
      </div>
    </div>
  );
}
