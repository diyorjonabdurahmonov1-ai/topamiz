"use client";

import type { Dictionary } from "@/lib/i18n";
import PhotoViewer from "./PhotoViewer";

// A same-page overlay for viewing a single uploaded photo full-screen
// (pinch to zoom) — deliberately never a plain `<a target="_blank">`
// navigation. On an installed PWA (especially iOS), target="_blank" breaks
// out of the standalone app into the system browser, which feels like
// getting thrown out of the site entirely rather than just viewing a picture.
export default function PhotoLightbox({
  url,
  onClose,
  dict,
}: {
  url: string;
  onClose: () => void;
  dict: Dictionary;
}) {
  return <PhotoViewer urls={[url]} index={0} onClose={onClose} dict={dict} />;
}
