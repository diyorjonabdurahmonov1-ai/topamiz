"use client";

import { useEffect } from "react";

// On touch screens, a long press on a link or picture opens the browser's
// own menu ("Open in new tab", "Download image", "Search Google for this
// image") — a dead giveaway that the Android app is a website. Swallow it,
// except inside form fields, where the menu is how people paste. Desktop
// right-click is left alone. Text selection is handled in globals.css.
export default function NativeFeel() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const onContextMenu = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);
  return null;
}
