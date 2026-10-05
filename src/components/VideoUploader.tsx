"use client";

import { useRef, useState } from "react";
import { AlertCircle, Loader2, Video, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

const MAX_DURATION_SECONDS = 120;
const ACCEPTED_TYPES = "video/mp4,video/quicktime,video/webm,video/x-matroska";

type Status = "idle" | "checking" | "uploading" | "done" | "error";

export default function VideoUploader({
  onChange,
  dict,
}: {
  onChange?: (video: { videoUrl: string; thumbnailUrl: string } | null) => void;
  dict: Dictionary;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
    });
  }

  // Deliberately one status for the whole pipeline (duration check, ffmpeg
  // compression, R2 upload) — the poster doesn't need a play-by-play of what
  // the server is doing to their file, just whether it worked in the end.
  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    // Set the preview immediately — the duration check and the error/done
    // states that follow all render inside that preview box, so it has to
    // exist before any of them can show up (otherwise a rejected file never
    // gets to tell the poster why).
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("checking");
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
        setStatus("error");
        setError(`${dict.postListing.videoUploadFailedPrefix}: ${dict.postListing.videoTooLongError}`);
        return;
      }
    } catch {
      // Fall through to uploading anyway — see comment above.
    }

    setStatus("uploading");
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload-video", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? dict.postListing.videoGenericError);
      setStatus("done");
      onChange?.({ videoUrl: data.videoUrl, thumbnailUrl: data.thumbnailUrl });
    } catch (err) {
      setStatus("error");
      setError(
        `${dict.postListing.videoUploadFailedPrefix}: ${
          err instanceof Error ? err.message : dict.postListing.videoGenericError
        }`
      );
    }
  }

  function removeVideo() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStatus("idle");
    setError("");
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
          {dict.postListing.videoUploading}
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70 p-3 text-center">
          <AlertCircle className="h-5 w-5 text-danger" />
          <span className="text-xs text-white">{error}</span>
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
