import Link from "next/link";
import { ArrowLeft, Check, Lock, MapPin, Phone } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { LegalContent } from "@/lib/legal";
import { categoryIcons } from "@/lib/icons";
import { formatTimeAgo } from "@/lib/i18n/format";
import { KIND_BADGE_CLASS, kindLabel, priceText } from "@/lib/listing-labels";
import AuthPanel from "./auth/AuthPanel";

const EXCERPT_LENGTH = 140;

// Cut on the server, so the rest of the description never reaches a guest's
// browser at all.
function excerpt(text: string): string {
  if (text.length <= EXCERPT_LENGTH) return text;
  const cut = text.slice(0, EXCERPT_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > EXCERPT_LENGTH / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function thumb(url: string): string {
  return url.startsWith("/api/uploads/") ? `${url}?w=240` : url;
}

// What a visitor who isn't registered sees of a listing: enough to know
// it's the one they want (one picture, title, price, place, the start of
// the description), and right under it the sign-up form, open already —
// the full listing and the poster's phone are for registered users only.
// Signing up brings them straight back here, to the whole listing.
export default function GuestListingGate({
  listing,
  dict,
  locale,
  legal,
  abroad,
}: {
  listing: Listing;
  dict: Dictionary;
  locale: Locale;
  legal: LegalContent;
  abroad: boolean;
}) {
  const t = dict.listingDetail;
  const Icon = categoryIcons[listing.category];
  const cover = listing.photoUrls[0] ?? listing.videoThumbnailUrl ?? null;
  const hiddenMedia = Math.max(0, listing.photoUrls.length - 1) + (listing.videoUrl && listing.photoUrls.length > 0 ? 1 : 0);
  const price = listing.isPromo ? null : priceText(dict, listing);
  const place = [listing.city, listing.district].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-6">
      <Link
        href="/elonlar"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.backLink}
      </Link>

      <div className="animate-fade-up rounded-3xl border border-border bg-surface p-3.5">
        <div className="flex gap-3.5">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime, not a build-time asset
              <img src={thumb(cover)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-white"
                style={{ backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}, ${listing.colorTo})` }}
              >
                <Icon className="h-8 w-8" strokeWidth={2} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white ${KIND_BADGE_CLASS[listing.kind]}`}>
              {kindLabel(dict, listing.kind)}
            </span>
            <h1 className="mt-1.5 line-clamp-2 text-base font-extrabold leading-snug">{listing.title}</h1>
            {price && <p className="mt-0.5 text-lg font-extrabold text-brand-via">{price}</p>}
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
              {place && (
                <>
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{place}</span>
                  <span aria-hidden>·</span>
                </>
              )}
              <time dateTime={listing.createdAt} suppressHydrationWarning>
                {formatTimeAgo(locale, listing.createdAt)}
              </time>
            </p>
          </div>
        </div>

        {listing.description && (
          <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted">
            {excerpt(listing.description)}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {hiddenMedia > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted">
              <Lock className="h-3.5 w-3.5" />
              {t.guestMorePhotos.replace("{count}", String(hiddenMedia))}
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted">
            <Phone className="h-3.5 w-3.5" />
            <span aria-hidden className="select-none tracking-widest blur-[3px]">
              +998 •• ••• •• ••
            </span>
            <Lock className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-muted">{t.guestPhoneLocked}</p>
      </div>

      <section id="royxatdan-otish" className="mt-6 scroll-mt-20">
        <h2 className="text-center text-xl font-extrabold tracking-tight">{t.guestTitle}</h2>
        <ul className="mx-auto mt-3 max-w-xs space-y-1.5">
          {[t.guestPerkFull, t.guestPerkPhone, t.guestPerkChat].map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {perk}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <AuthPanel
            dict={dict}
            initialTab="register"
            registerOnly
            legal={legal}
            abroad={abroad}
            next={`/elonlar/${listing.id}`}
          />
        </div>
      </section>
    </div>
  );
}
