import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-via">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-via hover:text-brand-to"
        >
          {linkLabel ?? "Barchasini ko'rish"}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
