// Sends a browser-side error to /api/client-errors (stored for
// /admin/xatolar). Noise that says nothing about our own code — browser
// extensions, cross-origin "Script error.", a harmless ResizeObserver
// warning — is dropped here, and each distinct error is sent at most once
// per page load, ten in total.

const IGNORED = [/ResizeObserver loop/i, /^Script error\.?$/i, /extension:\/\//i, /AbortError/i];
const sent = new Set<string>();
const MAX_PER_PAGE = 10;

export function reportClientError(error: unknown, extra?: { source?: string }) {
  try {
    const err = error instanceof Error ? error : null;
    const message = (err?.message || String(error ?? "")).slice(0, 500);
    const stack = (err?.stack ?? "").slice(0, 4000);
    if (!message || IGNORED.some((re) => re.test(message) || re.test(stack))) return;
    // The first stack frame names where it broke — part of what groups it.
    const source = extra?.source ?? stack.split("\n").find((line) => /\bat\b|@/.test(line))?.trim() ?? "";
    const key = `${message}|${source}`;
    if (sent.has(key) || sent.size >= MAX_PER_PAGE) return;
    sent.add(key);
    const body = JSON.stringify({
      message: `${err?.name && err.name !== "Error" ? `${err.name}: ` : ""}${message}`,
      stack,
      source,
      path: location.pathname,
    });
    if (navigator.sendBeacon?.(new URL("/api/client-errors", location.href), new Blob([body], { type: "application/json" }))) return;
    fetch("/api/client-errors", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
  } catch {
    // Reporting must never become the error.
  }
}

// After a deploy, a page that was left open still asks for the previous
// build's JavaScript files, which are gone — every navigation then fails
// with "Failed to load chunk". Reloading once picks up the new build.
export function isStaleBuildError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to load chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    message
  );
}

const RELOAD_KEY = "findo-stale-build-reload";

export function reloadForStaleBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY));
    // Once per minute at most — if the new build is broken too, don't loop.
    if (last && Date.now() - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  location.reload();
  return true;
}
