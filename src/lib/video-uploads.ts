import { mkdir, open, readdir, readFile, rm, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { uploadToR2 } from "./r2";
import { setListingVideo } from "./listings";

const execFileAsync = promisify(execFile);

export const MAX_RAW_SIZE = 300 * 1024 * 1024;
// Each chunk has to fit under Caddy's request_body limit on the server (see
// AGENTS.md) with plenty of room to spare, so one big phone video never has
// to travel as a single oversized request.
// Kept small so a chunk lost on a weak mobile connection is cheap to resend.
export const CHUNK_SIZE = 2 * 1024 * 1024;
const MAX_DURATION_SECONDS = 125; // 120s limit + a few seconds of tolerance
const SESSION_TTL_MS = 60 * 60 * 1000;
// Phones label their recordings inconsistently (video/3gpp, an empty type
// from some pickers, …), so the declared type is only a first filter —
// ffprobe in processVideo is what actually decides it's a real video.
export function isAcceptableVideoType(type: string): boolean {
  return type === "" || type.startsWith("video/");
}

type UploadStatus = "receiving" | "processing" | "done" | "error";

interface UploadSession {
  id: string;
  userId: number;
  size: number;
  received: number;
  chunks: Set<number>;
  status: UploadStatus;
  dir: string;
  createdAt: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  // Set when the poster published the listing before the video finished:
  // the video is filled into that listing as soon as it's ready.
  listingId?: string;
}

interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  pix_fmt?: string;
  bit_rate?: string;
}

interface FfprobeResult {
  format?: { duration?: string; bit_rate?: string };
  streams?: FfprobeStream[];
}

// In-memory is enough: the app runs as a single PM2 process, and an upload
// only has to survive the minute or two it takes — a restart mid-upload just
// means the poster retries.
const sessions = new Map<string, UploadSession>();
const ROOT = path.join(os.tmpdir(), "findo-video-uploads");

// Also clears folders on disk with no session in memory — left behind by an
// upload the poster abandoned before a server restart.
async function sweepExpired() {
  const now = Date.now();
  for (const session of sessions.values()) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(session.id);
  }
  const entries = await readdir(ROOT).catch(() => [] as string[]);
  for (const name of entries) {
    if (sessions.has(name)) continue;
    const dir = path.join(ROOT, name);
    const info = await stat(dir).catch(() => null);
    if (info && now - info.mtimeMs > SESSION_TTL_MS) await rm(dir, { recursive: true, force: true });
  }
}

export async function createUploadSession(userId: number, size: number): Promise<UploadSession> {
  await sweepExpired();
  const id = crypto.randomUUID();
  const dir = path.join(ROOT, id);
  await mkdir(dir, { recursive: true });
  await (await open(path.join(dir, "input"), "w")).close();
  const session: UploadSession = {
    id,
    userId,
    size,
    received: 0,
    chunks: new Set(),
    status: "receiving",
    dir,
    createdAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

export function getUploadSession(id: string, userId: number): UploadSession | null {
  const session = sessions.get(id);
  return session && session.userId === userId ? session : null;
}

// Links an upload to the listing it belongs to. If the video is already
// processed it's written to the listing right away; otherwise processVideo
// writes it when it finishes.
export function attachToListing(session: UploadSession, listingId: string): "attached" | "failed" {
  if (session.status === "error") return "failed";
  session.listingId = listingId;
  if (session.status === "done" && session.videoUrl && session.thumbnailUrl) {
    setListingVideo(listingId, session.videoUrl, session.thumbnailUrl);
  }
  return "attached";
}

// Each chunk is written at its own offset rather than appended, so chunks
// can arrive in any order (the client sends a few in parallel) and one the
// phone re-sends after a dropped connection just overwrites itself.
// `length` is what the client meant to send; a body that arrives shorter is
// "incomplete" and the client resends it.
export async function writeChunk(
  session: UploadSession,
  offset: number,
  length: number,
  data: Buffer
): Promise<"ok" | "invalid" | "incomplete"> {
  if (session.status !== "receiving") return "invalid";
  if (offset % CHUNK_SIZE !== 0 || length <= 0 || length > CHUNK_SIZE) return "invalid";
  if (offset + length > MAX_RAW_SIZE) return "invalid";
  if (data.length !== length) return "incomplete";

  const handle = await open(path.join(session.dir, "input"), "r+");
  try {
    await handle.write(data, 0, data.length, offset);
  } finally {
    await handle.close();
  }
  if (!session.chunks.has(offset)) {
    session.chunks.add(offset);
    session.received += data.length;
  }
  return "ok";
}

// The final size comes from the client at the end rather than from the
// start: Android can hand the browser a converted copy of a gallery video
// whose real length differs from the size it first reported.
export async function finishUpload(session: UploadSession, size: number): Promise<string | null> {
  if (session.status !== "receiving") return null;
  const onDisk = (await stat(path.join(session.dir, "input"))).size;
  const expectedChunks = Math.ceil(size / CHUNK_SIZE);
  if (size <= 0 || session.received !== size || onDisk !== size || session.chunks.size !== expectedChunks) {
    return "Fayl to'liq yuklanmadi";
  }

  session.status = "processing";
  // Compression can take a minute or more for a long phone clip — far
  // longer than a mobile browser will reliably hold one request open — so
  // it runs detached and the client polls for the result instead.
  processVideo(session).catch((err) => {
    console.error("Video processing failed:", err);
    session.status = "error";
    session.error = "Videoni qayta ishlashda xatolik yuz berdi. Qayta urinib ko'ring.";
  });
  return null;
}

async function processVideo(session: UploadSession) {
  const inputPath = path.join(session.dir, "input");
  const outputPath = path.join(session.dir, "output.mp4");
  const thumbnailPath = path.join(session.dir, "thumbnail.jpg");

  try {
    // ffprobe both confirms this is really a playable video (not just a file
    // with a spoofed extension/content-type) and gives us its duration in one
    // step, instead of trusting the browser's claimed metadata.
    let probe: FfprobeResult;
    try {
      const { stdout } = await execFileAsync("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration,bit_rate",
        "-show_entries",
        "stream=codec_type,codec_name,width,height,pix_fmt,bit_rate",
        "-of",
        "json",
        inputPath,
      ]);
      probe = JSON.parse(stdout) as FfprobeResult;
    } catch {
      session.status = "error";
      session.error = "Fayl mazmuni haqiqiy videoga mos kelmadi";
      return;
    }

    const hasVideoStream = probe.streams?.some((s) => s.codec_type === "video");
    const duration = Number(probe.format?.duration);
    if (!hasVideoStream || !Number.isFinite(duration)) {
      session.status = "error";
      session.error = "Fayl mazmuni haqiqiy videoga mos kelmadi";
      return;
    }
    if (duration > MAX_DURATION_SECONDS) {
      session.status = "error";
      session.error = "Video uzunligi 2 daqiqadan oshmasligi kerak";
      return;
    }

    // Most uploads arrive already compressed on the phone (H.264 + AAC at a
    // modest size) — those only need repackaging for fast streaming, which
    // takes a second instead of a full re-encode. Anything else is
    // re-encoded to a bounded resolution/bitrate so every clip costs
    // roughly the same, modest amount of R2 storage.
    const video = probe.streams?.find((s) => s.codec_type === "video");
    const audio = probe.streams?.find((s) => s.codec_type === "audio");
    const bitrate = Number(video?.bit_rate ?? probe.format?.bit_rate ?? 0);
    const copyVideo =
      video?.codec_name === "h264" &&
      video.pix_fmt === "yuv420p" &&
      Math.max(video.width ?? 0, video.height ?? 0) <= 1280 &&
      bitrate > 0 &&
      bitrate <= 3_500_000;
    const copyAudio = !audio || audio.codec_name === "aac";

    const videoArgs = copyVideo
      ? ["-c:v", "copy"]
      : [
          "-vf",
          "scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "28",
          "-maxrate",
          "2M",
          "-bufsize",
          "4M",
        ];
    const audioArgs = copyAudio ? ["-c:a", "copy"] : ["-c:a", "aac", "-b:a", "128k"];
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      ...videoArgs,
      ...audioArgs,
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-ss",
      "00:00:00.5",
      "-vframes",
      "1",
      "-vf",
      "scale='min(720,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
      thumbnailPath,
    ]);

    const key = crypto.randomUUID();
    const [videoUrl, thumbnailUrl] = await Promise.all([
      uploadToR2(`videos/${key}.mp4`, await readFile(outputPath), "video/mp4"),
      uploadToR2(`videos/${key}.jpg`, await readFile(thumbnailPath), "image/jpeg"),
    ]);
    session.videoUrl = videoUrl;
    session.thumbnailUrl = thumbnailUrl;
    session.status = "done";
    if (session.listingId) setListingVideo(session.listingId, videoUrl, thumbnailUrl);
  } finally {
    await rm(session.dir, { recursive: true, force: true });
  }
}
