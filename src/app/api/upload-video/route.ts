import { NextResponse } from "next/server";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

const execFileAsync = promisify(execFile);

const MAX_RAW_SIZE = 300 * 1024 * 1024;
const MAX_DURATION_SECONDS = 125; // 120s limit + a few seconds of tolerance
const ALLOWED_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"]);

interface FfprobeResult {
  format?: { duration?: string };
  streams?: { codec_type?: string }[];
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Video yuklash hozircha sozlanmagan. Birozdan so'ng qayta urinib ko'ring." },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  const limit = rateLimit(`upload-video:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p video yuklandi. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Faqat MP4, MOV yoki WEBM video qabul qilinadi" }, { status: 400 });
  }
  if (file.size > MAX_RAW_SIZE) {
    return NextResponse.json({ error: "Video hajmi 300MB dan oshmasligi kerak" }, { status: 400 });
  }

  const workDir = await mkdtemp(path.join(os.tmpdir(), "findo-video-"));
  const inputPath = path.join(workDir, "input");
  const outputPath = path.join(workDir, "output.mp4");
  const thumbnailPath = path.join(workDir, "thumbnail.jpg");

  try {
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

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
      return NextResponse.json({ error: "Fayl mazmuni haqiqiy videoga mos kelmadi" }, { status: 400 });
    }

    const hasVideoStream = probe.streams?.some((s) => s.codec_type === "video");
    const duration = Number(probe.format?.duration);
    if (!hasVideoStream || !Number.isFinite(duration)) {
      return NextResponse.json({ error: "Fayl mazmuni haqiqiy videoga mos kelmadi" }, { status: 400 });
    }
    if (duration > MAX_DURATION_SECONDS) {
      return NextResponse.json({ error: "Video uzunligi 2 daqiqadan oshmasligi kerak" }, { status: 400 });
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

    const id = crypto.randomUUID();
    const [videoUrl, thumbnailUrl] = await Promise.all([
      uploadToR2(`videos/${id}.mp4`, await readFile(outputPath), "video/mp4"),
      uploadToR2(`videos/${id}.jpg`, await readFile(thumbnailPath), "image/jpeg"),
    ]);

    return NextResponse.json({ videoUrl, thumbnailUrl });
  } catch (err) {
    console.error("Video processing failed:", err);
    return NextResponse.json(
      { error: "Videoni qayta ishlashda xatolik yuz berdi. Qayta urinib ko'ring." },
      { status: 500 }
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
