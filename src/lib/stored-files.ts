import { removeUpload } from "./images";
import { deleteFromR2, isR2Configured, R2_PUBLIC_URL } from "./r2";

const OWN_UPLOAD_PREFIX = "/api/uploads/";

// Deletes the files behind photo and video URLs: our own uploads from disk,
// videos and their thumbnails from R2. Anything else (a Google profile
// picture) isn't ours to delete and is skipped. Best effort: a file that
// can't be removed doesn't stop the rest.
export async function removeStoredFiles(urls: string[]): Promise<void> {
  await Promise.all(
    [...new Set(urls)].map(async (url) => {
      try {
        if (url.startsWith(OWN_UPLOAD_PREFIX)) {
          await removeUpload(url.slice(OWN_UPLOAD_PREFIX.length));
        } else if (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL) && isR2Configured()) {
          await deleteFromR2(url);
        }
      } catch (err) {
        console.error("[stored-files] could not delete", url, err);
      }
    })
  );
}
