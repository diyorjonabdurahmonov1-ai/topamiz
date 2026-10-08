"use client";

import { useRef } from "react";
import { AlertCircle, Camera, FolderOpen, Loader2, RotateCw, Video, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import {
  cancelVideoUpload,
  retryVideoUpload,
  startVideoUpload,
  useVideoUpload,
  type VideoSource,
} from "@/lib/video-upload-store";

const ACCEPTED_TYPES = "video/*";
// Adding a non-media type makes Android open its document picker ("My
// Files") instead of the photo picker. The photo picker can hand the
// browser a converted copy of an HEVC video that the browser then refuses
// to read (NotReadableError); the document picker hands over the original.
const FILES_ACCEPTED_TYPES = "video/*,application/octet-stream";

// A view of one upload in the site-wide store (lib/video-upload-store). The
// form only holds the upload's handle, so the upload itself keeps going if
// this component unmounts — e.g. the poster switches to the photo tab, or
// publishes and moves on to another page.
export default function VideoUploader({
  handle,
  onHandleChange,
  dict,
}: {
  handle: string | null;
  onHandleChange: (handle: string | null) => void;
  dict: Dictionary;
}) {
  const entry = useVideoUpload(handle);
  const galleryRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function pick(file: File | undefined, source: VideoSource) {
    if (!file) return;
    cancelVideoUpload(handle);
    onHandleChange(startVideoUpload(file, source, dict));
  }

  function removeVideo() {
    cancelVideoUpload(handle);
    onHandleChange(null);
  }

  const inputs = (
    <>
      <input
        ref={galleryRef}
        type="file"
        accept={ACCEPTED_TYPES}
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0], "gallery");
          e.target.value = "";
        }}
      />
      <input
        ref={filesRef}
        type="file"
        accept={FILES_ACCEPTED_TYPES}
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0], "files");
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept={ACCEPTED_TYPES}
        capture="environment"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0], "camera");
          e.target.value = "";
        }}
      />
    </>
  );

  const recordButton = (
    <button
      type="button"
      onClick={() => cameraRef.current?.click()}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand-via/40"
    >
      <Camera className="h-3.5 w-3.5" />
      {dict.postListing.videoRecord}
    </button>
  );

  if (entry?.readFailed) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-danger/40 bg-danger/5 p-4 text-center">
        {inputs}
        <AlertCircle className="h-5 w-5 text-danger" />
        <p className="text-sm font-semibold text-foreground">{entry.error}</p>
        <p className="text-xs text-muted">{dict.postListing.videoReadHint}</p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => filesRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-from to-brand-via px-3 py-1.5 text-xs font-semibold text-white"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {dict.postListing.videoPickFromFiles}
          </button>
          {recordButton}
        </div>
        {entry.errorCode && <span className="text-[10px] text-muted">{entry.errorCode}</span>}
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="space-y-2">
        {inputs}
        <div
          onClick={() => galleryRef.current?.click()}
          role="button"
          tabIndex={0}
          className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-center text-sm text-muted transition-colors hover:border-brand-via/40 hover:text-foreground"
        >
          <Video className="h-5 w-5" />
          {dict.postListing.videoUploadPrompt}
          <span className="text-xs text-muted">{dict.postListing.videoUploadHint}</span>
        </div>
        <div className="flex justify-center">{recordButton}</div>
      </div>
    );
  }

  const busy = entry.stage !== "done" && entry.stage !== "error";
  const stageLabel =
    entry.stage === "compressing"
      ? dict.postListing.videoCompressing
      : entry.stage === "processing"
        ? dict.postListing.videoProcessing
        : dict.postListing.videoUploading;
  const showProgress = entry.stage === "compressing" || entry.stage === "uploading";

  return (
    <div className="space-y-2">
      <div className="relative aspect-[9/16] max-w-[150px] overflow-hidden rounded-xl border border-border bg-bg-elevated">
        {entry.previewUrl && (
          <video src={entry.previewUrl} className="h-full w-full object-cover" muted playsInline />
        )}
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-center text-xs font-medium text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
            {stageLabel}
            {showProgress && (
              <div className="w-3/4">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-[width]"
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
                <span className="mt-1 block tabular-nums">{entry.progress}%</span>
              </div>
            )}
          </div>
        )}
        {entry.stage === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70 p-3 text-center">
            <AlertCircle className="h-5 w-5 text-danger" />
            <span className="text-xs text-white">{entry.error}</span>
            {entry.errorCode && <span className="text-[10px] text-white/50">{entry.errorCode}</span>}
            <button
              type="button"
              onClick={() => retryVideoUpload(entry.id)}
              className="mt-1 flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white"
            >
              <RotateCw className="h-3 w-3" />
              {dict.postListing.videoRetry}
            </button>
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
      {busy && <p className="text-xs text-muted">{dict.postListing.videoBackgroundHint}</p>}
    </div>
  );
}
