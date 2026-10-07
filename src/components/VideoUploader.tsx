"use client";

import { useRef, useState } from "react";
import { AlertCircle, Loader2, Video, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

const MAX_DURATION_SECONDS = 120;
const ACCEPTED_TYPES = "video/mp4,video/quicktime,video/webm,video/x-matroska";
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = (10 * 60 * 1000) / POLL_INTERVAL_MS;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000, 30000];
const PARALLEL_CHUNKS = 3;
const DURATION_CHECK_TIMEOUT_MS = 5000;
const EXTENSION_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
};

export type VideoUploadStatus = "idle" | "checking" | "uploading" | "done" | "error";

// `code` is shown under the message (e.g. "PUT 502", "PUT net", "read") so
// a screenshot of a failure says exactly which step broke and how.
class UploadError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable = false,
    readonly status = 0
  ) {
    super(message);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A phone that's offline, or has the browser in the background (screen
// locked, switched apps), can't send anything — retrying then only burns
// attempts, so wait for it to come back first.
function waitUntilReachable(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (navigator.onLine && document.visibilityState === "visible") {
        window.removeEventListener("online", check);
        document.removeEventListener("visibilitychange", check);
        resolve();
      }
    };
    window.addEventListener("online", check);
    document.addEventListener("visibilitychange", check);
    check();
  });
}

// Mobile connections drop for a few seconds all the time; a lost chunk
// shouldn't sink a whole video, so transient failures get spaced-out
// retries (about a minute in total, not counting time spent offline).
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof UploadError) || !err.retryable || i >= RETRY_DELAYS_MS.length) throw err;
      await sleep(RETRY_DELAYS_MS[i]);
      await waitUntilReachable();
    }
  }
}

async function keepScreenAwake(): Promise<{ release: () => Promise<void> } | null> {
  try {
    return (await navigator.wakeLock?.request("screen")) ?? null;
  } catch {
    return null;
  }
}

export default function VideoUploader({
  onChange,
  onStatusChange,
  dict,
}: {
  onChange?: (video: { videoUrl: string; thumbnailUrl: string } | null) => void;
  // Lets the post form know a video is still mid-upload, so it can hold off
  // actually submitting the listing until this resolves — otherwise a quick
  // tap on "post" right after picking a video ships the listing with no
  // video at all, since the upload hasn't produced a URL yet.
  onStatusChange?: (status: VideoUploadStatus) => void;
  dict: Dictionary;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<VideoUploadStatus>("idle");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Bumped whenever a new file is picked or the video is removed, so a
  // still-running upload loop for the old file stops touching state.
  const attemptRef = useRef(0);

  function updateStatus(next: VideoUploadStatus) {
    setStatus(next);
    onStatusChange?.(next);
  }

  function readDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error("unreadable"));
      };
      video.src = URL.createObjectURL(file);
      // Some phones never fire either event for a codec they can't decode.
      setTimeout(() => reject(new Error("timeout")), DURATION_CHECK_TIMEOUT_MS);
    });
  }

  // A few Android file pickers hand over an empty MIME type; fall back to
  // the extension so a perfectly normal .mp4 isn't rejected for it.
  function videoType(file: File): string {
    if (file.type) return file.type;
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext ? (EXTENSION_TYPES[ext] ?? "") : "";
  }

  // Deliberately one status for the whole pipeline (duration check, ffmpeg
  // compression, R2 upload) — the poster doesn't need a play-by-play of what
  // the server is doing to their file, just whether it worked in the end.
  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setErrorCode("");
    // Set the preview immediately — the duration check and the error/done
    // states that follow all render inside that preview box, so it has to
    // exist before any of them can show up (otherwise a rejected file never
    // gets to tell the poster why).
    setPreviewUrl(URL.createObjectURL(file));
    updateStatus("checking");
    try {
      // The browser can only report a duration for codecs it can itself
      // decode — a phone's HEVC/H.265 clip, or an unusual AI-generated
      // file, can fail this even though ffmpeg on the server (which
      // understands far more formats) would handle it fine. So this check
      // only ever blocks on a duration it actually managed to read; if the
      // browser can't read it at all, skip straight to uploading and let
      // the server's own ffprobe check be the real judge.
      const duration = await readDuration(file);
      if (duration > MAX_DURATION_SECONDS) {
        updateStatus("error");
        setError(`${dict.postListing.videoUploadFailedPrefix}: ${dict.postListing.videoTooLongError}`);
        return;
      }
    } catch {
      // Fall through to uploading anyway — see comment above.
    }

    const attempt = ++attemptRef.current;
    const stale = () => attempt !== attemptRef.current;
    updateStatus("uploading");
    const wakeLock = await keepScreenAwake();
    try {
      // A 404 mid-upload means the server restarted (e.g. a deploy) and
      // forgot the session — start over once on its own rather than making
      // the poster pick the video again.
      for (let round = 0; ; round++) {
        try {
          const result = await uploadOnce(file, stale);
          if (!result) return;
          updateStatus("done");
          onChange?.(result);
          return;
        } catch (err) {
          if (round === 0 && err instanceof UploadError && err.status === 404) continue;
          throw err;
        }
      }
    } catch (err) {
      if (stale()) return;
      updateStatus("error");
      if (err instanceof UploadError) {
        setError(`${dict.postListing.videoUploadFailedPrefix}: ${err.message || dict.postListing.videoGenericError}`);
        setErrorCode(err.code);
      } else {
        setError(`${dict.postListing.videoUploadFailedPrefix}: ${dict.postListing.videoGenericError}`);
        setErrorCode(err instanceof Error ? err.name : "");
      }
    } finally {
      await wakeLock?.release().catch(() => {});
    }
  }

  async function uploadOnce(
    file: File,
    stale: () => boolean
  ): Promise<{ videoUrl: string; thumbnailUrl: string } | null> {
    setProgress(0);
    setProcessing(false);
    const start = await withRetry(() =>
      requestJson("POST", "/api/upload-video", {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: videoType(file), size: file.size }),
      })
    );
    const base = `/api/upload-video/${start.uploadId as string}`;
    const chunkSize = start.chunkSize as number;

    const offsets: number[] = [];
    for (let offset = 0; offset < file.size; offset += chunkSize) offsets.push(offset);
    let sent = 0;
    let next = 0;
    let failed = false;
    async function worker() {
      try {
        while (next < offsets.length && !failed) {
          if (stale()) return;
          const offset = offsets[next++];
          const body = await readChunk(file, offset, chunkSize);
          await withRetry(() =>
            requestJson("PUT", `${base}?offset=${offset}`, {
              headers: { "Content-Type": "application/octet-stream" },
              body,
            })
          );
          sent += body.byteLength;
          setProgress(Math.min(100, Math.round((sent / file.size) * 100)));
        }
      } catch (err) {
        failed = true;
        throw err;
      }
    }
    await Promise.all(Array.from({ length: PARALLEL_CHUNKS }, worker));

    if (stale()) return null;
    await withRetry(() => requestJson("POST", base));
    setProcessing(true);

    for (let poll = 0; poll < MAX_POLLS; poll++) {
      await sleep(POLL_INTERVAL_MS);
      if (stale()) return null;
      const result = await withRetry(() => requestJson("GET", base));
      if (result.status === "done") {
        return { videoUrl: result.videoUrl as string, thumbnailUrl: result.thumbnailUrl as string };
      }
      if (result.status === "error") throw new UploadError((result.error as string) ?? "", "processing");
    }
    throw new UploadError("", "timeout");
  }

  // Reads each chunk into memory and sends the bytes, never the file-backed
  // Blob itself: Android Chrome refuses to upload a slice of a gallery or
  // Google Photos video directly (ERR_UPLOAD_FILE_CHANGED), failing every
  // request instantly even on a perfect connection.
  async function readChunk(file: File, offset: number, chunkSize: number): Promise<ArrayBuffer> {
    try {
      return await file.slice(offset, offset + chunkSize).arrayBuffer();
    } catch {
      throw new UploadError(dict.postListing.videoReadError, "read");
    }
  }

  // Reads a JSON reply without ever choking on an empty or non-JSON body
  // (a proxy rejecting the request, a gateway error page) — those become a
  // retryable error carrying the HTTP status instead.
  async function requestJson(
    method: string,
    url: string,
    init?: RequestInit
  ): Promise<Record<string, unknown>> {
    let res: Response;
    try {
      res = await fetch(url, { ...init, method });
    } catch {
      throw new UploadError(dict.postListing.videoNetworkError, `${method} net`, true);
    }
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (res.ok && data) return data;
    const code = `${method} ${res.status}`;
    const retryable = res.status >= 500 || res.status === 408 || res.status === 409 || res.status === 429;
    if (typeof data?.error === "string") throw new UploadError(data.error, code, retryable, res.status);
    throw new UploadError(dict.postListing.videoServerError, code, retryable, res.status);
  }

  function removeVideo() {
    attemptRef.current++;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    updateStatus("idle");
    setError("");
    setErrorCode("");
    onChange?.(null);
  }

  if (!previewUrl) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-center text-sm text-muted transition-colors hover:border-brand-via/40 hover:text-foreground"
      >
        <Video className="h-5 w-5" />
        {dict.postListing.videoUploadPrompt}
        <span className="text-xs text-muted">{dict.postListing.videoUploadHint}</span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          hidden
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-[9/16] max-w-[150px] overflow-hidden rounded-xl border border-border bg-bg-elevated">
      <video src={previewUrl} className="h-full w-full object-cover" muted playsInline />
      {(status === "checking" || status === "uploading") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-center text-xs font-medium text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          {status === "uploading" && processing ? dict.postListing.videoProcessing : dict.postListing.videoUploading}
          {status === "uploading" && !processing && (
            <div className="w-3/4">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <span className="mt-1 block tabular-nums">{progress}%</span>
            </div>
          )}
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70 p-3 text-center">
          <AlertCircle className="h-5 w-5 text-danger" />
          <span className="text-xs text-white">{error}</span>
          {errorCode && <span className="text-[10px] text-white/50">{errorCode}</span>}
        </div>
      )}
      <button
        type="button"
        onClick={removeVideo}
        aria-label={dict.postListing.videoRemove}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
