import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  // Not awaited: the server shouldn't wait for a scan of every upload to
  // start answering requests.
  const { stripMetadataFromExistingUploads } = await import("./lib/images");
  void stripMetadataFromExistingUploads().catch((err) => console.error("[images] metadata cleanup failed:", err));
}

// Server-side errors (a page or API route throwing) go to the same log as
// browser errors, for /admin/xatolar. Next still logs them to PM2 as before.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const error = err instanceof Error ? err : new Error(String(err));
    if (isNoise(error)) return;
    const { recordError } = await import("./lib/error-log");
    const digest = typeof err === "object" && err && "digest" in err ? String(err.digest) : "";
    const ua = request.headers["user-agent"];
    recordError({
      kind: "server",
      message: error.message,
      source: context.routePath,
      detail: [`${request.method} ${context.routePath} (${context.routeType})`, digest && `digest: ${digest}`, error.stack]
        .filter(Boolean)
        .join("\n"),
      path: request.path,
      userAgent: Array.isArray(ua) ? ua[0] : (ua ?? ""),
    });
  } catch {
    // Never let error logging take the request down with it.
  }
};

// Not faults of the site, and nothing to act on: a visitor closing the page
// or losing signal mid-upload ("aborted"), and a request carrying a server
// action id from another build — the site has no server actions, so that's
// a tab left open from an old deploy or a bot.
function isNoise(error: Error): boolean {
  const code = (error as Error & { code?: string }).code;
  return (
    error.message === "aborted" ||
    code === "ECONNRESET" ||
    error.message.startsWith("Failed to find Server Action")
  );
}
