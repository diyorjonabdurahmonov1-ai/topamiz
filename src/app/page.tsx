import AdCard from "@/components/AdCard";
import HomeTabs from "@/components/HomeTabs";
import { ads, getRewardedListings, listings } from "@/lib/data";

export default function Home() {
  const active = listings.filter((l) => l.status === "active");
  const lost = [...active]
    .filter((l) => l.kind === "lost")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);
  const found = [...active]
    .filter((l) => l.kind === "found")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);
  const rewarded = getRewardedListings().slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-10 sm:px-6 sm:py-8 lg:px-8">
      <AdCard ad={ads[0]} />
      <HomeTabs lost={lost} found={found} rewarded={rewarded} />
    </div>
  );
}
