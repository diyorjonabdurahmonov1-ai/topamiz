"use client";

import { useSyncExternalStore } from "react";

// On Android, an accept list of only image/* or video/* opens the photo
// picker (or the gallery app), which can hand the browser a converted or
// cloud-backed copy it then can't read (NotReadableError — seen on
// /admin/xatolar for gallery videos). Adding a non-media type makes Android
// open its document picker ("Files") instead, which hands over the
// original file; its Images and Videos sections still list everything in
// the gallery. Other platforms keep the plain list: iOS and desktops have
// no such problem and would only gain an "any file" option.
const noSubscribe = () => () => {};

export function usePickerAccept(accept: string): string {
  // false on the server and during hydration, so both renders agree; the
  // real answer right after.
  const android = useSyncExternalStore(
    noSubscribe,
    () => /Android/i.test(navigator.userAgent),
    () => false
  );
  return android ? `${accept},application/octet-stream` : accept;
}
