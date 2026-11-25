"use client";

import "leaflet/dist/leaflet.css";
import "@/lib/leaflet-text";
import { useEffect, useState } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const UZBEKISTAN_CENTER: [number, number] = [41.5, 64.5];

const PIN_ICON = divIcon({
  className: "",
  html: `<div style="
    width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
    background: linear-gradient(135deg, #6366f1, #22d3ee);
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
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

function Recenter({ target, zoom }: { target: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), zoom));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.[0], target?.[1]]);
  return null;
}

function ClickToPlace({ enabled, onPick }: { enabled: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
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

export default function LocationPickerMap({
  value,
  onChange,
  cityCenter = null,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  // Where to look when no point is placed yet (the chosen city); no pin
  // is drawn there — it is only where the map opens.
  cityCenter?: { lat: number; lng: number } | null;
}) {
  const isDark = useIsDark();
  const point: [number, number] | null = value ? [value.lat, value.lng] : null;
  const look: [number, number] | null = point ?? (cityCenter ? [cityCenter.lat, cityCenter.lng] : null);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={look ?? UZBEKISTAN_CENTER}
        zoom={point ? 13 : look ? 12 : 6}
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
        <ClickToPlace enabled onPick={(lat, lng) => onChange({ lat, lng })} />
        <Recenter target={look} zoom={point ? 13 : 12} />
        {point && (
          <Marker
            position={point}
            icon={PIN_ICON}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                onChange({ lat: pos.lat, lng: pos.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
