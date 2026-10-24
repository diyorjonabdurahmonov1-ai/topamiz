"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { listenForAppLinks } from "@/lib/native-app-client";

// Inside the phone apps only: a findo.net.uz link tapped in another app
// opens that page here instead of the home page.
export default function NativeAppBridge() {
  const router = useRouter();
  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    void listenForAppLinks((path) => router.push(path)).then((unlisten) => {
      if (cancelled) unlisten();
      else stop = unlisten;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [router]);
  return null;
}
