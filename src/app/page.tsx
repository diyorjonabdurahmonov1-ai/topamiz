import AdCarousel from "@/components/AdCarousel";
import HomeTabs from "@/components/HomeTabs";
import { getActiveAds } from "@/lib/ads";
import { getRewardedListings, listings } from "@/lib/data";

export default function Home() {
  const active = listings.filter((l) => l.status === "active");
  const allLost = [...active]
    .filter((l) => l.kind === "lost")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allFound = [...active]
    .filter((l) => l.kind === "found")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allRewarded = getRewardedListings();
  const ads = getActiveAds();

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="blob animate-float-slow pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full"
        style={{ background: "var(--brand-via)" }}
      />
      <div
        aria-hidden="true"
        className="blob animate-float pointer-events-none absolute -right-16 top-4 h-64 w-64 rounded-full"
        style={{ background: "var(--brand-to)" }}
      />
      <div
        aria-hidden="true"
        className="blob animate-float-slow pointer-events-none absolute left-1/3 top-72 h-56 w-56 rounded-full"
        style={{ background: "var(--accent-gold)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-6 pb-10 sm:px-6 sm:py-8 lg:px-8">
        <AdCarousel ads={ads} />
        <HomeTabs
          lost={allLost.slice(0, 8)}
          found={allFound.slice(0, 8)}
          rewarded={allRewarded.slice(0, 8)}
          lostCount={allLost.length}
          foundCount={allFound.length}
          rewardedCount={allRewarded.length}
        />
      </div>
    </div>
  );
}
