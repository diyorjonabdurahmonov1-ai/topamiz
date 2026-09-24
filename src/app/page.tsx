import AdCard from "@/components/AdCard";
import HomeTabs from "@/components/HomeTabs";
import { ads, getRewardedListings, listings } from "@/lib/data";

export default function Home() {
  const active = listings.filter((l) => l.status === "active");
  const allLost = [...active]
    .filter((l) => l.kind === "lost")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allFound = [...active]
    .filter((l) => l.kind === "found")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allRewarded = getRewardedListings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-10 sm:px-6 sm:py-8 lg:px-8">
      <AdCard ad={ads[0]} />
      <HomeTabs
        lost={allLost.slice(0, 8)}
        found={allFound.slice(0, 8)}
        rewarded={allRewarded.slice(0, 8)}
        lostCount={allLost.length}
        foundCount={allFound.length}
        rewardedCount={allRewarded.length}
      />
    </div>
  );
}
