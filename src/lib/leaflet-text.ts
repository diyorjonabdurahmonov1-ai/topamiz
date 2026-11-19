import { Control } from "leaflet";

// Leaflet's own words — the zoom buttons' tooltips and the link to the
// library — are English. Imported (for its effect) by each map component,
// which only ever load in the browser, where the page's language is on <html>.
const ZOOM: Record<string, [string, string]> = {
  uz: ["Yaqinlashtirish", "Uzoqlashtirish"],
  ru: ["Приблизить", "Отдалить"],
  en: ["Zoom in", "Zoom out"],
  kk: ["Жақындату", "Алыстату"],
  ky: ["Жакындатуу", "Алыстатуу"],
  tg: ["Наздик кардан", "Дур кардан"],
};

if (typeof document !== "undefined") {
  const [zoomInTitle, zoomOutTitle] = ZOOM[document.documentElement.lang] ?? ZOOM.uz;
  Control.Zoom.mergeOptions({ zoomInTitle, zoomOutTitle });
  // The default prefix carries an English tooltip ("A JavaScript library for
  // interactive maps"); the OpenStreetMap credit next to it is untouched.
  Control.Attribution.mergeOptions({
    prefix: '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>',
  });
}
