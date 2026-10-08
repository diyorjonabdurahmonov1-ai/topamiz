import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { getAllListingsForAdmin } from "@/lib/listings";
import { countryName } from "@/lib/country-names";
import AdminListingRow from "@/components/AdminListingRow";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Barcha e'lonlar — Findo",
};

export default async function AdminListingsPage(props: PageProps<"/admin/elonlar">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const countryFilter = typeof searchParams.country === "string" ? searchParams.country : "";
  const all = getAllListingsForAdmin();
  const listings = countryFilter ? all.filter((l) => l.country === countryFilter) : all;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Barcha e'lonlar</h1>
      <p className="mt-1.5 text-sm text-muted">
        Jami {listings.length} ta e'lon{countryFilter ? ` — ${countryName(countryFilter)}` : ""}. Davlat va
        holatidan qat'i nazar, saytdagi barcha e'lonlar shu yerda.
      </p>
      {countryFilter && (
        <Link
          href="/admin/elonlar"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Filtrni tozalash
        </Link>
      )}

      <div className="mt-5 space-y-2.5">
        {listings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            E'lon topilmadi.
          </p>
        ) : (
          listings.map((listing) => <AdminListingRow key={listing.id} listing={listing} />)
        )}
      </div>
    </div>
  );
}
