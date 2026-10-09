import { renderToStaticMarkup } from "react-dom/server";
import { divIcon, type DivIcon } from "leaflet";
import { categoryIcons } from "./icons";
import type { CategoryId } from "./types";

// Map markers that say what was lost or found: a pin in the category's
// colours with its icon (document, phone, key…) in a white disc. Leaflet
// markers are plain HTML, so the icon is rendered to an SVG string once per
// category and reused. Client-only — import from components loaded with
// `ssr: false` (Leaflet touches `window`). The pin's own z-index:0 is
// load-bearing: Leaflet gives every svg in the map pane z-index 200, which
// would otherwise paint the pin over its icon.
const cache = new Map<string, DivIcon>();

export function categoryPinIcon(category: CategoryId, colorFrom: string, colorTo: string): DivIcon {
  const key = `${category}|${colorFrom}|${colorTo}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const Icon = categoryIcons[category] ?? categoryIcons.boshqa;
  const svg = renderToStaticMarkup(<Icon size={16} strokeWidth={2.25} color={colorFrom} />);
  const gradientId = `findo-pin-${category}`;

  const icon = divIcon({
    className: "",
    html: `<div style="position:relative;width:38px;height:46px;filter:drop-shadow(0 3px 5px rgba(0,0,0,.35))">
      <svg width="38" height="46" viewBox="0 0 38 46" style="position:absolute;inset:0;z-index:0">
        <defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${colorFrom}"/><stop offset="1" stop-color="${colorTo}"/>
        </linearGradient></defs>
        <path d="M19 44.5C17 41.6 3 29.4 3 18.5a16 16 0 0 1 32 0C35 29.4 21 41.6 19 44.5z" fill="url(#${gradientId})" stroke="#fff" stroke-width="2"/>
        <circle cx="19" cy="18.5" r="12" fill="#fff"/>
      </svg>
      <div style="position:absolute;z-index:1;left:7px;top:6.5px;width:24px;height:24px;display:flex;align-items:center;justify-content:center">${svg}</div>
    </div>`,
    iconSize: [38, 46],
    iconAnchor: [19, 45],
    popupAnchor: [0, -42],
  });
  cache.set(key, icon);
  return icon;
}
