export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  // Not awaited: the server shouldn't wait for a scan of every upload to
  // start answering requests.
  const { stripMetadataFromExistingUploads } = await import("./lib/images");
  void stripMetadataFromExistingUploads().catch((err) => console.error("[images] metadata cleanup failed:", err));
}
