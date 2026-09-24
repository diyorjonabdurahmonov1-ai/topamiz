"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Reading a thread/notifications marks messages read server-side, but the
// root layout's unread badge lives in a shared layout segment that Next's
// router cache won't refetch on a normal child navigation. Forcing a
// refresh here re-runs the whole route tree, including that layout, so the
// badge count updates immediately instead of only after a hard reload.
export default function RefreshOnMount() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
