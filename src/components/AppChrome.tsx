"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// /reels is meant to feel like Instagram's own Reels tab — truly edge to
// edge, no site chrome around it. Every other route keeps the normal
// Navbar/Footer/BottomNav shell. Rendered server-side in layout.tsx and
// handed in here as already-built elements so Navbar/Footer/BottomNav stay
// server components where they can be.
export default function AppChrome({
  navbar,
  footer,
  bottomNav,
  children,
}: {
  navbar: ReactNode;
  footer: ReactNode;
  bottomNav: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const fullscreen = pathname === "/reels";

  if (fullscreen) {
    return <main className="h-dvh w-full overflow-hidden bg-black">{children}</main>;
  }

  return (
    <>
      {navbar}
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <div className="hidden sm:block">{footer}</div>
      {bottomNav}
    </>
  );
}
