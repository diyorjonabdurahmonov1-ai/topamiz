import AdShowcase from "@/components/AdShowcase";
import HomeTabs from "@/components/HomeTabs";
import HomeMapPreview from "@/components/HomeMapPreview";
import { getActiveAds } from "@/lib/ads";
import { getAllActiveListings, getMysteryBoxListings, getRewardedListings } from "@/lib/listings";
import { getCurrentUser } from "@/lib/auth";
import { getVisitorCountry } from "@/lib/geo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

const TAB_PREVIEW_SIZE = 4;

export default async function Home() {
  const country = await getVisitorCountry();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  const active = getAllActiveListings(country);
  const allLost = [...active]
    .filter((l) => l.kind === "lost")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allFound = [...active]
    .filter((l) => l.kind === "found")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allRewarded = getRewardedListings(country);
  // Sirli quti is login-gated — a guest never gets this data at all, not
  // just a hidden UI element.
  const allMysteryBox = user ? getMysteryBoxListings(country) : [];
  const ads = getActiveAds();
  const nearby = active.slice(0, 12);

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
        <AdShowcase ads={ads} dict={dict} />
        <HomeTabs
          lost={allLost.slice(0, TAB_PREVIEW_SIZE)}
          found={allFound.slice(0, TAB_PREVIEW_SIZE)}
          rewarded={allRewarded.slice(0, TAB_PREVIEW_SIZE)}
          mysteryBox={allMysteryBox.slice(0, TAB_PREVIEW_SIZE)}
          mysteryBoxLoggedIn={!!user}
          dict={dict}
          mapPreview={<HomeMapPreview listings={nearby} dict={dict} locale={locale} />}
        />
      </div>
    </div>
  );
}
