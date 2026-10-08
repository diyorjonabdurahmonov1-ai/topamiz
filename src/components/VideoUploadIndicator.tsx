"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, RotateCw, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import {
  dismissVideoUpload,
  retryVideoUpload,
  useVideoUploads,
  type VideoUploadEntry,
} from "@/lib/video-upload-store";

const DONE_VISIBLE_MS = 6000;

// Instagram-style status bar for videos of listings that are already
// published: the poster can keep using the site while it finishes.
export default function VideoUploadIndicator({ dict }: { dict: Dictionary }) {
  const uploads = useVideoUploads().filter((e) => e.listingId);

  const doneIds = uploads
    .filter((e) => e.stage === "done")
    .map((e) => e.id)
    .join(",");
  useEffect(() => {
    if (!doneIds) return;
    const timers = doneIds.split(",").map((id) => setTimeout(() => dismissVideoUpload(id), DONE_VISIBLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [doneIds]);

  if (uploads.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-20 z-50 flex flex-col gap-2 sm:bottom-4 sm:right-auto sm:w-80">
      {uploads.map((entry) => (
        <Pill key={entry.id} entry={entry} dict={dict} />
      ))}
    </div>
  );
}

function Pill({ entry, dict }: { entry: VideoUploadEntry; dict: Dictionary }) {
  const t = dict.postListing;
  const label =
    entry.stage === "done"
      ? t.videoBgDone
      : entry.stage === "error"
        ? t.videoBgFailed
        : entry.stage === "compressing"
          ? t.videoCompressing
          : entry.stage === "processing"
            ? t.videoProcessing
            : t.videoUploading;
  const showProgress = entry.stage === "compressing" || entry.stage === "uploading";

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-bg-elevated/95 p-2.5 shadow-xl backdrop-blur-lg">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">
        {entry.previewUrl && (
          <video src={entry.previewUrl} className="h-full w-full object-cover" muted playsInline />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
          {entry.stage === "done" ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : entry.stage === "error" ? (
            <AlertCircle className="h-5 w-5 text-danger" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold">
          <span className="truncate">{label}</span>
          {showProgress && <span className="shrink-0 tabular-nums text-muted">{entry.progress}%</span>}
        </div>
        {showProgress || entry.stage === "processing" || entry.stage === "preparing" ? (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-brand-from to-brand-via transition-[width] ${
                showProgress ? "" : "w-1/3 animate-pulse"
              }`}
              style={showProgress ? { width: `${entry.progress}%` } : undefined}
            />
          </div>
        ) : entry.stage === "done" ? (
          <Link href={`/elonlar/${entry.listingId}`} className="mt-0.5 block text-[11px] font-semibold text-brand-via">
            {t.videoBgView}
          </Link>
        ) : (
          <p className="mt-0.5 truncate text-[11px] text-muted">{entry.errorCode || entry.error}</p>
        )}
      </div>

      {entry.stage === "error" && !entry.readFailed && (
        <button
          type="button"
          onClick={() => retryVideoUpload(entry.id)}
          aria-label={t.videoRetry}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      )}
      {(entry.stage === "done" || entry.stage === "error") && (
        <button
          type="button"
          onClick={() => dismissVideoUpload(entry.id)}
          aria-label={t.videoRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
