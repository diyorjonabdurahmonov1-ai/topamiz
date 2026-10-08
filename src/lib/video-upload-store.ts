import { useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/i18n";
import { compressVideo } from "./video-compress";

// Video uploads live here, outside any one page, so an upload keeps going
// while the poster moves around the site — Instagram-style. A listing can
// be published while its video is still on the way; the server fills the
// video in when it's ready (see /api/upload-video/[id]/attach).

const MAX_DURATION_SECONDS = 120;
const MAX_RAW_SIZE = 300 * 1024 * 1024;
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

export type VideoSource = "gallery" | "files" | "camera";
export type VideoStage = "preparing" | "compressing" | "uploading" | "processing" | "done" | "error";

export interface VideoUploadEntry {
  id: string;
  stage: VideoStage;
  // 0–100 within the current stage.
  progress: number;
  previewUrl: string | null;
  error: string;
  errorCode: string;
  // The phone wouldn't hand the file over at all — retrying the same file
  // can't help, only picking it another way can.
  readFailed: boolean;
  result: { videoUrl: string; thumbnailUrl: string } | null;
  serverUploadId: string | null;
  // Set once the listing this video belongs to has been published.
  listingId: string | null;
}

interface Internal {
  picked: File;
  source: VideoSource;
  dict: Dictionary;
  file: Blob | null;
  uploadBlob: Blob | null;
  run: number;
  cancelled: boolean;
}

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

let entries: VideoUploadEntry[] = [];
const internals = new Map<string, Internal>();
const listeners = new Set<() => void>();
const EMPTY: VideoUploadEntry[] = [];

function emit() {
  syncLeaveWarning();
  for (const listener of listeners) listener();
}

function update(id: string, patch: Partial<VideoUploadEntry>) {
  entries = entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVideoUpload(id: string | null): VideoUploadEntry | null {
  return (id && entries.find((e) => e.id === id)) || null;
}

export function useVideoUploads(): VideoUploadEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => entries,
    () => EMPTY
  );
}

export function useVideoUpload(id: string | null): VideoUploadEntry | null {
  const all = useVideoUploads();
  return (id && all.find((e) => e.id === id)) || null;
}

// Leaving the site entirely (closing the tab, a full reload) would kill an
// upload still in flight, so the browser asks first — moving between pages
// inside the site is fine and doesn't trigger this.
function onBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
}
let warningOn = false;
function syncLeaveWarning() {
  if (typeof window === "undefined") return;
  const active = entries.some((e) => e.stage !== "done" && e.stage !== "error");
  if (active && !warningOn) window.addEventListener("beforeunload", onBeforeUnload);
  if (!active && warningOn) window.removeEventListener("beforeunload", onBeforeUnload);
  warningOn = active;
}

export function startVideoUpload(picked: File, source: VideoSource, dict: Dictionary): string {
  const id = crypto.randomUUID();
  internals.set(id, { picked, source, dict, file: null, uploadBlob: null, run: 0, cancelled: false });
  entries = [
    ...entries,
    {
      id,
      stage: "preparing",
      progress: 0,
      previewUrl: null,
      error: "",
      errorCode: "",
      readFailed: false,
      result: null,
      serverUploadId: null,
      listingId: null,
    },
  ];
  emit();
  void run(id);
  return id;
}

// Drops an upload nobody will use (the poster removed the video, or left
// the form without publishing). A published listing's upload is never
// cancelled this way.
export function cancelVideoUpload(id: string | null) {
  const entry = getVideoUpload(id);
  if (!entry || entry.listingId) return;
  const it = internals.get(entry.id);
  if (it) it.cancelled = true;
  removeEntry(entry.id);
}

export function dismissVideoUpload(id: string) {
  const entry = getVideoUpload(id);
  if (!entry || (entry.stage !== "done" && entry.stage !== "error")) return;
  removeEntry(id);
}

function removeEntry(id: string) {
  const entry = getVideoUpload(id);
  if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
  internals.delete(id);
  entries = entries.filter((e) => e.id !== id);
  emit();
}

export function retryVideoUpload(id: string) {
  const entry = getVideoUpload(id);
  if (!entry || entry.stage !== "error" || entry.readFailed) return;
  update(id, { stage: "preparing", progress: 0, error: "", errorCode: "", serverUploadId: null });
  void run(id);
}

// Resolves with the server's id for this upload as soon as there is one —
// that's all a listing needs to be published with a video still on the way.
export function whenServerUploadId(id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const check = () => {
      const entry = getVideoUpload(id);
      if (!entry || entry.stage === "error") {
        listeners.delete(check);
        reject(new Error(entry?.error || "cancelled"));
      } else if (entry.serverUploadId) {
        listeners.delete(check);
        resolve(entry.serverUploadId);
      }
    };
    listeners.add(check);
    check();
  });
}

export interface ListingVideoFields {
  videoUrl?: string;
  videoThumbnailUrl?: string;
  videoUploadId?: string;
}

// What a post form sends for its video: the finished URLs if the upload is
// already done, otherwise just the upload's id — the listing is published
// right away and the video follows (call markVideoSubmitted afterwards).
// Throws if the upload failed, so the form can say so.
export async function videoFieldsForListing(handle: string | null): Promise<ListingVideoFields> {
  const entry = getVideoUpload(handle);
  if (!entry) return {};
  if (entry.stage === "error") throw new Error(entry.error);
  if (entry.result) return { videoUrl: entry.result.videoUrl, videoThumbnailUrl: entry.result.thumbnailUrl };
  return { videoUploadId: await whenServerUploadId(entry.id) };
}

// Tells the server which listing this video belongs to; from then on the
// server attaches the video itself when it's ready.
export async function markVideoSubmitted(id: string, listingId: string) {
  const entry = getVideoUpload(id);
  const it = internals.get(id);
  if (!entry || !it) return;
  update(id, { listingId });
  if (!entry.serverUploadId) return; // A fresh upload session carries listingId itself.
  try {
    await withRetry(() =>
      requestJson(it.dict, "POST", `/api/upload-video/${entry.serverUploadId}/attach`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      })
    );
  } catch {
    // 404: the session was lost (server restart) — the upload's own retry
    // starts a new session that carries listingId. Anything else surfaces
    // through the upload's own error state.
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

// Reads a JSON reply without ever choking on an empty or non-JSON body
// (a proxy rejecting the request, a gateway error page) — those become a
// retryable error carrying the HTTP status instead.
async function requestJson(
  dict: Dictionary,
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

// A few Android file pickers hand over an empty MIME type; fall back to
// the extension so a perfectly normal .mp4 isn't rejected for it.
function videoType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? (EXTENSION_TYPES[ext] ?? "") : "";
}

function readDuration(file: Blob): Promise<number> {
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

// Tries each way the browser offers to read a file, since a phone that
// refuses one sometimes allows another; the error names of every failed
// attempt end up in the code shown to the poster.
async function copyToMemory(picked: File, dict: Dictionary): Promise<Blob> {
  const failures: string[] = [];
  const attempts: [string, () => Promise<ArrayBuffer | Blob>][] = [
    ["buffer", () => picked.arrayBuffer()],
    ["stream", () => new Response(picked.stream()).blob()],
    [
      "reader",
      () =>
        new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(picked);
        }),
    ],
  ];
  for (const [name, read] of attempts) {
    try {
      const data = await read();
      const blob = data instanceof Blob ? data : new Blob([data]);
      if (blob.size > 0) return blob;
      failures.push(`${name}:empty`);
    } catch (err) {
      failures.push(`${name}:${err instanceof Error ? err.name : "error"}`);
    }
  }
  throw new UploadError(dict.postListing.videoReadError, `read ${failures.join(" ")}`);
}

// Sends what went wrong to the server log, so a failure on a real phone
// can be diagnosed without needing the poster to describe it.
function reportFailure(picked: File, source: VideoSource, code: string) {
  const ext = picked.name.split(".").pop()?.toLowerCase() ?? "";
  fetch("/api/upload-video/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      source,
      type: picked.type,
      ext,
      size: picked.size,
      modifiedAgoSeconds: Math.round((Date.now() - picked.lastModified) / 1000),
      userAgent: navigator.userAgent,
    }),
  }).catch(() => {});
}

// Android often hands the browser a gallery or Google Photos video as a
// stream that can only be read front-to-back — reading a slice from the
// middle of it fails outright. So the file is read once, in order, and cut
// into chunks as it goes; each chunk is sent as plain bytes, never as a
// file-backed Blob, which Android Chrome also refuses to upload
// (ERR_UPLOAD_FILE_CHANGED). If streaming isn't possible at all, reading
// the whole file in one go is the last resort.
async function* readSequentially(
  file: Blob,
  chunkSize: number,
  dict: Dictionary
): AsyncGenerator<Uint8Array<ArrayBuffer>> {
  let buffer: Uint8Array<ArrayBuffer> = new Uint8Array(chunkSize);
  let filled = 0;
  let produced = false;
  try {
    const reader = file.stream().getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      let pos = 0;
      while (pos < value.length) {
        const take = Math.min(chunkSize - filled, value.length - pos);
        buffer.set(value.subarray(pos, pos + take), filled);
        filled += take;
        pos += take;
        if (filled === chunkSize) {
          produced = true;
          yield buffer;
          buffer = new Uint8Array(chunkSize);
          filled = 0;
        }
      }
    }
  } catch {
    if (produced) throw new UploadError(dict.postListing.videoReadError, "read stream");
    let whole: ArrayBuffer;
    try {
      whole = await file.arrayBuffer();
    } catch {
      throw new UploadError(dict.postListing.videoReadError, "read full");
    }
    for (let at = 0; at < whole.byteLength; at += chunkSize) {
      yield new Uint8Array(whole.slice(at, at + chunkSize));
    }
    return;
  }
  if (filled > 0) yield buffer.slice(0, filled);
}

async function run(id: string) {
  const it = internals.get(id);
  if (!it) return;
  const token = ++it.run;
  const stale = () => it.cancelled || it.run !== token || !internals.has(id);
  const { dict, picked, source } = it;
  const fail = (message: string, code: string, readFailed = false) => {
    if (stale()) return;
    update(id, {
      stage: "error",
      error: `${dict.postListing.videoUploadFailedPrefix}: ${message}`,
      errorCode: code,
      readFailed,
    });
    reportFailure(picked, source, code);
  };

  if (!it.file) {
    if (picked.size > MAX_RAW_SIZE) {
      update(id, {
        stage: "error",
        error: `${dict.postListing.videoUploadFailedPrefix}: ${dict.postListing.videoTooLargeError}`,
      });
      return;
    }
    // Copy the video into memory first, before anything else touches it:
    // Android gallery apps often grant the browser only short-lived access
    // to a picked file, and it can lapse before the upload gets to it.
    try {
      it.file = await copyToMemory(picked, dict);
    } catch (err) {
      fail(dict.postListing.videoReadError, err instanceof UploadError ? err.code : "read", true);
      return;
    }
    if (stale()) return;
    update(id, { previewUrl: URL.createObjectURL(it.file) });

    try {
      // The browser can only report a duration for codecs it can itself
      // decode, so this only ever blocks on a duration it actually read —
      // otherwise the server's own ffprobe check is the judge.
      const duration = await readDuration(it.file);
      if (duration > MAX_DURATION_SECONDS) {
        update(id, {
          stage: "error",
          error: `${dict.postListing.videoUploadFailedPrefix}: ${dict.postListing.videoTooLongError}`,
        });
        return;
      }
    } catch {
      // Fall through — see above.
    }
  }

  const wakeLock = await keepScreenAwake();
  try {
    // A 404 mid-upload means the server restarted (e.g. a deploy) and
    // forgot the session — start over once on its own.
    for (let round = 0; ; round++) {
      try {
        const result = await uploadOnce(id, it, stale);
        if (!result || stale()) return;
        update(id, { stage: "done", progress: 100, result });
        return;
      } catch (err) {
        if (round === 0 && err instanceof UploadError && err.status === 404) continue;
        throw err;
      }
    }
  } catch (err) {
    const code = err instanceof UploadError ? err.code : err instanceof Error ? err.name : "";
    const message = err instanceof UploadError && err.message ? err.message : dict.postListing.videoGenericError;
    fail(message, code);
  } finally {
    await wakeLock?.release().catch(() => {});
  }
}

async function uploadOnce(
  id: string,
  it: Internal,
  stale: () => boolean
): Promise<{ videoUrl: string; thumbnailUrl: string } | null> {
  const { dict } = it;
  const file = it.file!;
  const start = await withRetry(() =>
    requestJson(dict, "POST", "/api/upload-video", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: videoType(it.picked),
        size: file.size,
        listingId: getVideoUpload(id)?.listingId ?? undefined,
      }),
    })
  );
  if (stale()) return null;
  const base = `/api/upload-video/${start.uploadId as string}`;
  const chunkSize = start.chunkSize as number;
  update(id, { serverUploadId: start.uploadId as string });

  if (!it.uploadBlob) {
    update(id, { stage: "compressing", progress: 0 });
    const compressed = await compressVideo(
      file,
      (fraction) => update(id, { progress: Math.round(fraction * 100) }),
      stale
    );
    if (stale()) return null;
    it.uploadBlob = compressed ?? file;
  }
  const blob = it.uploadBlob;

  update(id, { stage: "uploading", progress: 0 });
  // Read strictly front-to-back and keep a few chunks in flight at once.
  let offset = 0;
  let sent = 0;
  const inFlight = new Set<Promise<void>>();
  for await (const piece of readSequentially(blob, chunkSize, dict)) {
    if (stale()) return null;
    const at = offset;
    offset += piece.byteLength;
    const upload = withRetry(() =>
      requestJson(dict, "PUT", `${base}?offset=${at}&length=${piece.byteLength}`, {
        headers: { "Content-Type": "application/octet-stream" },
        body: piece,
      })
    ).then(() => {
      sent += piece.byteLength;
      if (!stale()) update(id, { progress: Math.min(99, Math.round((sent / Math.max(blob.size, offset)) * 100)) });
    });
    inFlight.add(upload);
    upload.then(
      () => inFlight.delete(upload),
      () => inFlight.delete(upload)
    );
    if (inFlight.size >= PARALLEL_CHUNKS) await Promise.race(inFlight);
  }
  await Promise.all(inFlight);
  if (offset === 0) throw new UploadError(dict.postListing.videoReadError, "read empty");

  if (stale()) return null;
  await withRetry(() =>
    requestJson(dict, "POST", base, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ size: offset }),
    })
  );
  update(id, { stage: "processing", progress: 0 });

  for (let poll = 0; poll < MAX_POLLS; poll++) {
    await sleep(POLL_INTERVAL_MS);
    if (stale()) return null;
    const result = await withRetry(() => requestJson(dict, "GET", base));
    if (result.status === "done") {
      return { videoUrl: result.videoUrl as string, thumbnailUrl: result.thumbnailUrl as string };
    }
    if (result.status === "error") throw new UploadError((result.error as string) ?? "", "processing");
  }
  throw new UploadError("", "timeout");
}
