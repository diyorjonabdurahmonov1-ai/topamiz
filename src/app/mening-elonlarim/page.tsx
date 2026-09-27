import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getListingsByOwner } from "@/lib/listings";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import MyListingRow from "@/components/MyListingRow";

export const metadata: Metadata = {
  title: "Mening e'lonlarim — Findo",
};

export default async function MyListingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  const dict = getDictionary(await getLocale());
  const listings = getListingsByOwner(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{dict.myListings.title}</h1>

      <div className="mt-6 space-y-3">
        {listings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
            {dict.myListings.emptyBody}
          </p>
        ) : (
          listings.map((listing) => <MyListingRow key={listing.id} listing={listing} dict={dict} />)
        )}
      </div>
    </div>
  );
}
