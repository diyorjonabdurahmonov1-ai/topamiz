// A photo URL a client sends back (listing, message, tag, avatar) must be
// one of our own uploads, as /api/upload returned it: one file name, no
// path segments or query. A bare "/api/uploads/" prefix check would also let
// "/api/uploads/../admin/…" through, which a browser resolves to another
// page of the site and requests with the viewer's cookies when the "photo"
// is shown.
const OWN_UPLOAD = /^\/api\/uploads\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif)$/i;

export function isOwnUploadUrl(url: unknown): url is string {
  return typeof url === "string" && OWN_UPLOAD.test(url);
}
