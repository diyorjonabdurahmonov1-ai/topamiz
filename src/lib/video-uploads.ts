import { mkdir, open, readFile, rm, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { uploadToR2 } from "./r2";

const execFileAsync = promisify(execFile);

export const MAX_RAW_SIZE = 300 * 1024 * 1024;
// Each chunk has to fit under Caddy's request_body limit on the server (see
// AGENTS.md) with plenty of room to spare, so one big phone video never has
// to travel as a single oversized request.
export const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_DURATION_SECONDS = 125; // 120s limit + a few seconds of tolerance
const SESSION_TTL_MS = 60 * 60 * 1000;
export const ALLOWED_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"]);

type UploadStatus = "receiving" | "processing" | "done" | "error";

interface UploadSession {
  id: string;
  userId: number;
  size: number;
  received: number;
  status: UploadStatus;
  dir: string;
  createdAt: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

interface FfprobeResult {
  format?: { duration?: string };
  streams?: { codec_type?: string }[];
}

// In-memory is enough: the app runs as a single PM2 process, and an upload
// only has to survive the minute or two it takes — a restart mid-upload just
// means the poster retries.
const sessions = new Map<string, UploadSession>();
const ROOT = path.join(os.tmpdir(), "findo-video-uploads");

function sweepExpired() {
  const now = Date.now();
  for (const session of sessions.values()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(session.id);
      rm(session.dir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

export async function createUploadSession(userId: number, size: number): Promise<UploadSession> {
  sweepExpired();
  const id = crypto.randomUUID();
  const dir = path.join(ROOT, id);
  await mkdir(dir, { recursive: true });
  await (await open(path.join(dir, "input"), "w")).close();
  const session: UploadSession = {
    id,
    userId,
    size,
    received: 0,
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

// Writes a chunk at its own offset rather than appending, so a chunk the
// phone re-sends after a dropped connection (the server got it, the reply
// didn't make it back) just overwrites itself instead of corrupting the file.
export async function writeChunk(session: UploadSession, offset: number, data: Buffer): Promise<string | null> {
  if (session.status !== "receiving") return "Bu yuklash allaqachon yakunlangan";
  if (offset > session.received) return "Bo'lak tartibi buzildi";
  if (data.length === 0 || data.length > CHUNK_SIZE) return "Bo'lak hajmi noto'g'ri";
  if (offset + data.length > session.size) return "Fayl hajmi kutilganidan katta";

  const handle = await open(path.join(session.dir, "input"), "r+");
  try {
    await handle.write(data, 0, data.length, offset);
  } finally {
    await handle.close();
  }
  session.received = Math.max(session.received, offset + data.length);
  return null;
}

export async function finishUpload(session: UploadSession): Promise<string | null> {
  if (session.status !== "receiving") return null;
  const { size } = await stat(path.join(session.dir, "input"));
  if (session.received !== session.size || size !== session.size) return "Fayl to'liq yuklanmadi";

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
        "format=duration",
        "-show_entries",
        "stream=codec_type",
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

    // Re-encode to a bounded resolution/bitrate so every uploaded clip costs
    // roughly the same, modest amount of R2 storage regardless of how the
    // phone camera originally recorded it.
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      inputPath,
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
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
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
  } finally {
    await rm(session.dir, { recursive: true, force: true });
  }
}
