"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { divIcon, type LatLngBoundsExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import Link from "next/link";
import { Gift, KeyRound, LayoutGrid, LocateFixed, MapPin, PackageSearch, Search, Sparkles, Tag, type LucideIcon } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { CATEGORY_COLORS } from "@/lib/category-colors";
import { mapSectionOf, mapSections, type MapSection } from "@/lib/map-sections";
import { categoryIcons } from "@/lib/icons";
import { formatSom } from "@/lib/data";
import { categoryPinIcon } from "@/lib/map-pins";

// CARTO's free basemaps (previously used here) started requiring a signed-up
// API key in Aug 2026 and watermark every tile "API KEY REQUIRED" without
// one. Standard OpenStreetMap tiles need no key/signup; dark mode is faked
// with a CSS filter (see .map-dark in globals.css) since OSM only has one style.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const YOU_ICON = divIcon({
  className: "",
  html: `<div style="position:relative; width:20px; height:20px;">
    <div style="position:absolute; inset:0; border-radius:50%; background:#6366f1; opacity:0.35; animation: topamiz-pulse 1.8s ease-out infinite;"></div>
    <div style="position:absolute; inset:5px; border-radius:50%; background:#6366f1; border:2px solid white; box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
  </div>
  <style>@keyframes topamiz-pulse { 0% { transform: scale(0.6); opacity: 0.5; } 100% { transform: scale(2.2); opacity: 0; } }</style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function useIsDark() {
  // Safe to read the DOM synchronously here: this component is only ever
  // loaded client-side via next/dynamic's `ssr: false`, so it never runs
  // during a server render and there's no hydration mismatch to avoid.
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains("dark")));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [bounds, map]);
  return null;
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 14);
  }, [target, map]);
  return null;
}

// react-leaflet only applies MapContainer's `style` prop once, at initial
// mount — it never re-applies it as the prop object changes on later
// renders. Leaflet's own touch handlers also don't reliably reclaim
// pinch-zoom from the browser (which otherwise treats it as native
// page/image zoom) on their own, so this reaches in and sets it directly on
// the live container whenever `active` (fully interactive, not the
// decorative preview) changes. An interactive map is meant to be
// immediately draggable, at the cost of the page being harder to scroll
// past while a finger is on it.
function TouchActionSync({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.touchAction = active ? "none" : "";
  }, [active, map]);
  return null;
}

export default function ListingsMap({
  listings,
  dict,
  interactive = true,
  heightClassName = "h-[520px]",
  bare = false,
  initialMe = null,
}: {
  listings: Listing[];
  dict: Dictionary;
  // false renders a purely decorative preview (no dragging/zoom/locate
  // button) — used for the home page teaser, which is wrapped in its own
  // link so the map itself never needs to capture touch gestures.
  interactive?: boolean;
  heightClassName?: string;
  // true drops this component's own border/rounded-corner/height chrome —
  // for embedding inside a parent that already provides its own frame
  // (the home page teaser card).
  bare?: boolean;
  // Seeds the "you are here" marker/fly-to without waiting on the manual
  // locate-me button — used to auto-center on the visitor's own location
  // (home page teaser, and continuing into the full map from it).
  initialMe?: [number, number] | null;
}) {
  const isDark = useIsDark();
  const dragEnabled = interactive;
  // `initialMe` often arrives after mount (async geolocation lookup
  // upstream) — read it directly rather than copying it into state, so a
  // later prop update still takes effect. A manual locate-me tap overrides
  // it via `meOverride`.
  const [meOverride, setMeOverride] = useState<[number, number] | null>(null);
  const me = meOverride ?? initialMe;
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  // One section at a time (null = all), so a busy map can be narrowed to
  // just, say, lost items or cars. A section that drops out of the listings
  // (the page's own filters changed) falls back to showing everything.
  const sections = useMemo(() => mapSections(listings), [listings]);
  const [picked, setPicked] = useState<MapSection | null>(null);
  const section = picked && sections.some((s) => s.section === picked) ? picked : null;
  const visible = useMemo(
    () => (section ? listings.filter((l) => mapSectionOf(l) === section) : listings),
    [listings, section]
  );

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (visible.length === 0) return null;
    return visible.map((l) => [l.lat, l.lng] as [number, number]);
  }, [visible]);

  const center: [number, number] = listings[0] ? [listings[0].lat, listings[0].lng] : [41.2995, 69.2401];

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setLocateError(dict.map.locationError);
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMeOverride([position.coords.latitude, position.coords.longitude]);
        setLocating(false);
      },
      (err) => {
        // A browser never re-shows its permission prompt after the visitor
        // has already denied it once — the only way forward is for them to
        // flip it back on themselves in the browser's own site settings.
        setLocateError(
          err.code === err.PERMISSION_DENIED ? dict.map.locationPermissionDenied : dict.map.locationError
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div
      className={
        bare
          ? "relative h-full w-full"
          : `relative w-full overflow-hidden rounded-2xl border border-border ${heightClassName}`
      }
    >
      <MapContainer
        center={center}
        zoom={12}
        dragging={dragEnabled}
        touchZoom={dragEnabled}
        scrollWheelZoom={dragEnabled}
        doubleClickZoom={dragEnabled}
        boxZoom={dragEnabled}
        keyboard={dragEnabled}
        // Zoom buttons go bottom-left: the section chips take the top edge.
        zoomControl={false}
        attributionControl={interactive}
        className={`h-full w-full ${isDark ? "map-dark" : ""}`}
        style={{ background: isDark ? "#1a1a2e" : "#eef1f6" }}
      >
        <TileLayer url={TILES} attribution={ATTRIBUTION} />
        {interactive && <ZoomControl position="bottomleft" />}
        <TouchActionSync active={dragEnabled} />
        <FitBounds bounds={bounds} />
        <FlyTo target={me} />

        {visible.map((listing) => {
          const Icon = categoryIcons[listing.category];
          return (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lng]}
              icon={categoryPinIcon(
                listing.category,
                listing.colorFrom,
                listing.colorTo,
                listing.isMysteryBox || listing.isPromo ? undefined : listing.kind === "lost" || listing.kind === "found" ? listing.kind : undefined
              )}
            >
              <Popup>
                <div className="w-52">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}, ${listing.colorTo})`,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{listing.title}</p>
                      <p className="truncate text-xs text-gray-500">
                        {dict.categories[listing.category]} · {listing.city}
                      </p>
                    </div>
                  </div>
                  {listing.reward ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <Gift className="h-3 w-3" />
                      {formatSom(listing.reward)} {dict.common.rewardSuffix}
                    </p>
                  ) : null}
                  <Link
                    href={`/elonlar/${listing.id}`}
                    className="mt-2 block rounded-lg bg-indigo-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    {dict.map.viewListing}
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {me && (
          <Marker position={me} icon={YOU_ICON}>
            <Popup>{dict.map.you}</Popup>
          </Marker>
        )}
      </MapContainer>

      {interactive && sections.length > 1 && (
        <div className="absolute inset-x-0 top-0 z-[1000] flex gap-1.5 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SectionChip active={section === null} onClick={() => setPicked(null)} Icon={LayoutGrid} label={dict.listingsPage.kindAll} count={listings.length} />
          {sections.map(({ section: s, count }) => {
            const { Icon, label, color } = sectionLook(s, dict);
            return (
              <SectionChip
                key={s}
                active={section === s}
                onClick={() => setPicked(section === s ? null : s)}
                Icon={Icon}
                label={label}
                count={count}
                color={color}
              />
            );
          })}
        </div>
      )}

      {interactive && (
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 rounded-xl border border-border bg-surface/95 px-3 py-2 text-xs font-semibold text-foreground shadow-lg backdrop-blur transition-colors hover:bg-surface-2 disabled:opacity-70"
        >
          <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-pulse" : ""}`} />
          {dict.map.myLocationButton}
        </button>
      )}

      {interactive && locateError && (
        <p className="absolute bottom-14 right-3 z-[1000] max-w-[220px] rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          {locateError}
        </p>
      )}

      {interactive && listings.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/95 px-4 py-2.5 text-sm font-semibold text-muted shadow-lg backdrop-blur">
            <MapPin className="h-4 w-4" />
            {dict.listingsPage.noResultsTitle}
          </div>
        </div>
      )}
    </div>
  );
}

function sectionLook(section: MapSection, dict: Dictionary): { Icon: LucideIcon; label: string; color: string } {
  switch (section) {
    case "lost":
      return { Icon: Search, label: dict.tabs.lost, color: "#f97316" };
    case "found":
      return { Icon: PackageSearch, label: dict.tabs.found, color: "#0ea5e9" };
    case "rent":
      return { Icon: KeyRound, label: dict.classifieds.kindRent, color: "#14b8a6" };
    case "promo":
      return { Icon: Tag, label: dict.listingCard.promo, color: "#ec4899" };
    case "mystery":
      return { Icon: Sparkles, label: dict.nav.mysteryBox, color: "#f59e0b" };
    default: {
      const category = section.slice(4) as keyof typeof CATEGORY_COLORS;
      return { Icon: categoryIcons[category], label: dict.categories[category], color: CATEGORY_COLORS[category].from };
    }
  }
}

function SectionChip({
  active,
  onClick,
  Icon,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  Icon: LucideIcon;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur transition-colors ${
        active ? "btn-brand text-white" : "border border-border bg-surface/95 text-foreground hover:bg-surface-2"
      }`}
    >
      <Icon className="h-3.5 w-3.5" style={active || !color ? undefined : { color }} />
      {label}
      <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/25" : "bg-surface-2 text-muted"}`}>{count}</span>
    </button>
  );
}
