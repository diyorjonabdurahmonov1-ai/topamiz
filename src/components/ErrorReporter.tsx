"use client";

import { useEffect } from "react";
import { isStaleBuildError, reloadForStaleBuild, reportClientError } from "@/lib/error-report";

// Catches what nothing else catches: uncaught errors and rejected promises
// anywhere on the page. Errors inside React rendering are reported by the
// error boundaries (app/error.tsx, app/global-error.tsx) instead.
export default function ErrorReporter() {
  useEffect(() => {
    function handle(error: unknown, source?: string) {
      if (isStaleBuildError(error) && reloadForStaleBuild()) return;
      reportClientError(error, source ? { source } : undefined);
    }
    const onError = (e: ErrorEvent) => {
      // A script from another origin (analytics, ads) only ever says
      // "Script error." — nothing to act on.
      if (e.filename && !e.filename.startsWith(location.origin)) return;
      handle(e.error ?? e.message, e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : undefined);
    };
    const onRejection = (e: PromiseRejectionEvent) => handle(e.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
