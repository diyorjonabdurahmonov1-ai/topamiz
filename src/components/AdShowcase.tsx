import type { AdBanner } from "@/lib/ads";
import type { Dictionary } from "@/lib/i18n";

function AdPanel({ ad, dict, className = "" }: { ad: AdBanner; dict: Dictionary; className?: string }) {
  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      className={`card-hover group relative block aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-surface-2 sm:aspect-auto sm:h-full ${className}`}
    >
      {ad.mediaType === "video" ? (
        <video
          key={ad.id}
          src={ad.mediaUrl}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded ad media (may be an animated GIF), not a build-time asset
        <img
          src={ad.mediaUrl}
          alt={ad.title || dict.ads.fallbackAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
        {dict.nav.ads}
      </span>

      {ad.title && (
        <span className="pointer-events-none absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-bold leading-snug text-white drop-shadow-sm">
          {ad.title}
        </span>
      )}
    </a>
  );
}

export default function AdShowcase({ ads, dict }: { ads: AdBanner[]; dict: Dictionary }) {
  if (ads.length === 0) return null;
  const top = ads.slice(0, 3);

  if (top.length === 1) {
    return (
      <div className="sm:h-56">
        <AdPanel ad={top[0]} dict={dict} />
      </div>
    );
  }

  if (top.length === 2) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:h-56 sm:grid-cols-2">
        <AdPanel ad={top[0]} dict={dict} />
        <AdPanel ad={top[1]} dict={dict} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:h-[420px] sm:grid-cols-2 sm:grid-rows-2">
      <AdPanel ad={top[0]} dict={dict} className="sm:row-span-2" />
      <AdPanel ad={top[1]} dict={dict} />
      <AdPanel ad={top[2]} dict={dict} />
    </div>
  );
}
