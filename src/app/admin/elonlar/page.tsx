import type { Metadata } from "next";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { getAllListingsForAdmin } from "@/lib/listings";
import { countryName } from "@/lib/country-names";
import AdminListingRow from "@/components/AdminListingRow";
import { requireAdmin } from "@/lib/auth";
import type { Listing } from "@/lib/types";

export const metadata: Metadata = {
  title: "Barcha e'lonlar — Findo",
};

const PAGE_SIZE = 50;

const TYPES: { id: string; label: string; match: (l: Listing) => boolean }[] = [
  { id: "lost", label: "Yo'qolgan", match: (l) => !l.isMysteryBox && !l.isPromo && l.kind === "lost" },
  { id: "found", label: "Topilgan", match: (l) => !l.isMysteryBox && !l.isPromo && l.kind === "found" },
  { id: "mystery", label: "Sirli quti", match: (l) => l.isMysteryBox },
  { id: "promo", label: "Taklif", match: (l) => l.isPromo },
];

const STATUSES: { id: string; label: string }[] = [
  { id: "active", label: "Faol" },
  { id: "resolved", label: "Hal qilingan" },
];

function param(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function AdminListingsPage(props: PageProps<"/admin/elonlar">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const country = param(searchParams.country);
  const q = param(searchParams.q).trim();
  const type = param(searchParams.type);
  const status = param(searchParams.status);
  const shown = Math.max(PAGE_SIZE, Number(param(searchParams.show)) || PAGE_SIZE);

  const needle = q.toLowerCase();
  const typeFilter = TYPES.find((t) => t.id === type);
  const listings = getAllListingsForAdmin().filter(
    (l) =>
      (!country || l.country === country) &&
      (!typeFilter || typeFilter.match(l)) &&
      (!status || l.status === status) &&
      (!needle ||
        l.title.toLowerCase().includes(needle) ||
        l.description.toLowerCase().includes(needle) ||
        (l.ownerName ?? "").toLowerCase().includes(needle) ||
        l.id === q)
  );
  const filtered = !!(country || q || type || status);

  // A link to this page with one filter changed, keeping the others.
  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ country, q, type, status, ...changes })) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/admin/elonlar?${qs}` : "/admin/elonlar";
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Barcha e&apos;lonlar</h1>
      <p className="mt-1.5 text-sm text-muted">
        {listings.length} ta e&apos;lon{country ? ` — ${countryName(country)}` : ""}
        {filtered ? " (filtr bo'yicha)" : ""}. Davlat va holatidan qat&apos;i nazar, saytdagi barcha e&apos;lonlar shu
        yerda.
      </p>

      <form method="GET" className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-surface px-3">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Sarlavha, tavsif, egasi yoki e'lon raqami..."
          className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
        />
        {country && <input type="hidden" name="country" value={country} />}
        {type && <input type="hidden" name="type" value={type} />}
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {TYPES.map((t) => (
          <Chip key={t.id} href={href({ type: type === t.id ? "" : t.id })} active={type === t.id}>
            {t.label}
          </Chip>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        {STATUSES.map((s) => (
          <Chip key={s.id} href={href({ status: status === s.id ? "" : s.id })} active={status === s.id}>
            {s.label}
          </Chip>
        ))}
        {filtered && (
          <Link
            href="/admin/elonlar"
            className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Filtrni tozalash
          </Link>
        )}
      </div>

      <div className="mt-5 space-y-2.5">
        {listings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            E&apos;lon topilmadi.
          </p>
        ) : (
          listings.slice(0, shown).map((listing) => <AdminListingRow key={listing.id} listing={listing} />)
        )}
      </div>
      {listings.length > shown && (
        <Link
          href={`${href({})}${filtered ? "&" : "?"}show=${shown + PAGE_SIZE}`}
          scroll={false}
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-border bg-surface py-2.5 text-sm font-semibold hover:bg-surface-2"
        >
          Yana ko&apos;rsatish ({listings.length - shown} ta qoldi)
        </Link>
      )}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? "border-brand-via/50 bg-brand-via/10 text-brand-via" : "border-border bg-surface text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
