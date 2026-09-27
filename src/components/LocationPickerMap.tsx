"use client";

import "leaflet/dist/leaflet.css";
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

function Recenter({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 13));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.[0], target?.[1]]);
  return null;
}

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}) {
  const isDark = useIsDark();
  const point: [number, number] | null = value ? [value.lat, value.lng] : null;

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={point ?? UZBEKISTAN_CENTER}
        zoom={point ? 13 : 6}
        scrollWheelZoom
        className={`h-full w-full ${isDark ? "map-dark" : ""}`}
        style={{ background: isDark ? "#1a1a2e" : "#eef1f6" }}
      >
        <TileLayer url={TILES} attribution={ATTRIBUTION} />
        <ClickToPlace onPick={(lat, lng) => onChange({ lat, lng })} />
        <Recenter target={point} />
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
