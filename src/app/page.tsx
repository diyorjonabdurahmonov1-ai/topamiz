import SectionHeading from "@/components/SectionHeading";
import ListingCard from "@/components/ListingCard";
import AdCard from "@/components/AdCard";
import { ads, getRewardedListings, listings } from "@/lib/data";

export default function Home() {
  const active = listings.filter((l) => l.status === "active");
  const lost = [...active]
    .filter((l) => l.kind === "lost")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);
  const found = [...active]
    .filter((l) => l.kind === "found")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);
  const rewarded = getRewardedListings().slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <AdCard ad={ads[0]} />

      <section className="mt-10">
        <SectionHeading title="Yo'qolgan buyumlar" href="/elonlar?kind=lost" />
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {lost.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading title="Topilgan buyumlar" href="/elonlar?kind=found" />
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {found.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mt-12 pb-10">
        <SectionHeading title="Mukofotli e'lonlar" href="/mukofotli" />
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rewarded.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
