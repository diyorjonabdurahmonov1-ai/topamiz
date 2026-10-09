"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { categoryPinIcon } from "@/lib/map-pins";
import type { CategoryId } from "@/lib/types";

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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

// react-leaflet only applies MapContainer's `style` prop once, at initial
// mount — it never re-applies it as the prop object changes on later
// renders. Leaflet's own touch handlers also don't reliably reclaim
// pinch-zoom from the browser (which otherwise treats it as native
// page/image zoom) on their own, so this reaches in and sets it directly on
// the live container. The map is meant to be immediately draggable, at the
// cost of the page being harder to scroll past while a finger is on it.
function TouchActionSync() {
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.touchAction = "none";
  }, [map]);
  return null;
}

export default function LeafletPinMap({
  lat,
  lng,
  category,
  colorFrom,
  colorTo,
}: {
  lat: number;
  lng: number;
  category: CategoryId;
  colorFrom: string;
  colorTo: string;
}) {
  const isDark = useIsDark();

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        dragging
        touchZoom
        scrollWheelZoom
        doubleClickZoom
        boxZoom
        keyboard
        className={`h-full w-full ${isDark ? "map-dark" : ""}`}
        style={{ background: isDark ? "#1a1a2e" : "#eef1f6" }}
      >
        <TileLayer url={TILES} attribution={ATTRIBUTION} />
        <TouchActionSync />
        <Marker position={[lat, lng]} icon={categoryPinIcon(category, colorFrom, colorTo)} />
      </MapContainer>
    </div>
  );
}
