import HomeQuickAccess from "@/components/HomeQuickAccess";
import { getActiveAds } from "@/lib/ads";
import { getAllActiveListings, getPromoListings } from "@/lib/listings";
import { getVisitorCountry } from "@/lib/geo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

const RECENT_SIZE = 10;

export default async function Home() {
  const country = await getVisitorCountry();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  // Already newest first.
  const active = getAllActiveListings(country);
  const promoCount = getPromoListings(country).length;
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

      <div className="relative mx-auto max-w-5xl px-4 py-4 pb-10 sm:px-6 sm:py-8 lg:px-8">
        <HomeQuickAccess
          dict={dict}
          locale={locale}
          ads={ads}
          nearby={nearby}
          recent={active.slice(0, RECENT_SIZE)}
          promoCount={promoCount}
        />
      </div>
    </div>
  );
}
