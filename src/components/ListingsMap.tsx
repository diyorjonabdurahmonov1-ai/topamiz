"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { divIcon, type LatLngBoundsExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import Link from "next/link";
import { Gift, LocateFixed, MapPin } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { categoryIcons } from "@/lib/icons";
import { formatSom } from "@/lib/data";

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function pinIcon(colorFrom: string, colorTo: string) {
  return divIcon({
    className: "",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: linear-gradient(135deg, ${colorFrom}, ${colorTo});
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

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

export default function ListingsMap({ listings, dict }: { listings: Listing[]; dict: Dictionary }) {
  const isDark = useIsDark();
  const [me, setMe] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (listings.length === 0) return null;
    return listings.map((l) => [l.lat, l.lng] as [number, number]);
  }, [listings]);

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
        setMe([position.coords.latitude, position.coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocateError(dict.map.locationError);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: isDark ? "#1a1a2e" : "#eef1f6" }}
      >
        <TileLayer url={isDark ? DARK_TILES : LIGHT_TILES} attribution={ATTRIBUTION} />
        <FitBounds bounds={bounds} />
        <FlyTo target={me} />

        {listings.map((listing) => {
          const Icon = categoryIcons[listing.category];
          return (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lng]}
              icon={pinIcon(listing.colorFrom, listing.colorTo)}
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

      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 rounded-xl border border-border bg-surface/95 px-3 py-2 text-xs font-semibold text-foreground shadow-lg backdrop-blur transition-colors hover:bg-surface-2 disabled:opacity-70"
      >
        <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-pulse" : ""}`} />
        {dict.map.myLocationButton}
      </button>

      {locateError && (
        <p className="absolute bottom-14 right-3 z-[1000] max-w-[220px] rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          {locateError}
        </p>
      )}

      {listings.length === 0 && (
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
