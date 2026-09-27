"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import type { Dictionary } from "@/lib/i18n";

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const PIN_ICON = divIcon({
  className: "",
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
    background: linear-gradient(135deg, #6366f1, #22d3ee);
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains("dark")));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function LeafletPinMap({ lat, lng, dict }: { lat: number; lng: number; dict: Dictionary }) {
  const isDark = useIsDark();
  const [active, setActive] = useState(false);

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        dragging={active}
        touchZoom={active}
        scrollWheelZoom={active}
        doubleClickZoom={active}
        boxZoom={active}
        keyboard={active}
        className={`h-full w-full ${isDark ? "map-dark" : ""}`}
        style={{ background: isDark ? "#1a1a2e" : "#eef1f6" }}
      >
        <TileLayer url={TILES} attribution={ATTRIBUTION} />
        <Marker position={[lat, lng]} icon={PIN_ICON} />
      </MapContainer>

      {!active && (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="absolute inset-0 z-[600] flex items-center justify-center bg-bg/10"
        >
          <span className="rounded-full bg-bg/80 px-4 py-2 text-xs font-semibold text-foreground shadow-lg backdrop-blur">
            {dict.map.tapToInteract}
          </span>
        </button>
      )}
    </div>
  );
}
