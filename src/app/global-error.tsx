"use client";

import { useEffect } from "react";
import { isStaleBuildError, reloadForStaleBuild, reportClientError } from "@/lib/error-report";

// Only shown when the root layout itself fails — app/error.tsx can't, since
// it renders inside that layout. Replaces the whole page, so it brings its
// own <html> and plain inline styles (globals.css may not have loaded).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (isStaleBuildError(error) && reloadForStaleBuild()) return;
    reportClientError(error, { source: error.digest ? `global:${error.digest}` : "global" });
  }, [error]);

  return (
    <html lang="uz">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#05060a", color: "#f3f4f8" }}>
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 26, margin: 0 }}>Nimadir xato ketdi</h1>
          <p style={{ color: "#9199b3", fontSize: 14, lineHeight: 1.5 }}>
            Kechirasiz, sahifani yuklashda kutilmagan xatolik yuz berdi. Qayta urinib ko&apos;ring.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 16, padding: "10px 20px", borderRadius: 12, border: 0, background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 14 }}
          >
            Qayta urinish
          </button>
        </div>
      </body>
    </html>
  );
}
