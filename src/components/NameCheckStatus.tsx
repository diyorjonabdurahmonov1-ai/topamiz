import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { NameCheck } from "@/lib/use-name-check";

// The live "is this name free?" answer (lib/use-name-check): an icon at the
// end of the name field and a line under it.
export function NameCheckIcon({ status }: { status: NameCheck }) {
  if (status === "checking") return <Loader2 aria-hidden className="h-4 w-4 shrink-0 animate-spin text-muted" />;
  if (status === "available") return <CircleCheck aria-hidden className="h-5 w-5 shrink-0 text-success" />;
  if (status === "taken" || status === "invalid") return <CircleX aria-hidden className="h-5 w-5 shrink-0 text-danger" />;
  return null;
}

export function NameCheckMessage({ status, dict, className = "" }: { status: NameCheck; dict: Dictionary; className?: string }) {
  const t = dict.login;
  if (status === "idle") return null;
  const tone = status === "available" ? "text-success" : status === "checking" ? "text-muted" : "text-danger";
  const text =
    status === "checking"
      ? t.nameChecking
      : status === "available"
        ? t.nameAvailable
        : status === "taken"
          ? t.errors.nameTaken
          : t.errors.nameReserved;
  return (
    <p role="status" aria-live="polite" className={`text-[11px] font-semibold ${tone} ${className}`}>
      {text}
      {status === "taken" && <span className="mt-0.5 block font-normal text-muted">{t.nameTakenHint}</span>}
    </p>
  );
}

// Field border to match.
export function nameCheckBorder(status: NameCheck): string {
  if (status === "available") return "border-success/60";
  if (status === "taken" || status === "invalid") return "border-danger/70";
  return "";
}
