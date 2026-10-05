"use client";

import { useState } from "react";
import { ImagePlus, Video } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import ImageUploader from "./ImageUploader";
import VideoUploader, { type VideoUploadStatus } from "./VideoUploader";

type MediaTab = "photo" | "video";

// Photo and video used to be two separate cards on the post form. A poster
// only ever wants one or the other for a given listing, so a single card
// with a tab switcher reads as "pick your media" instead of "fill out two
// upload sections."
export default function MediaUploader({
  onImagesChange,
  onVideoChange,
  onVideoStatusChange,
  dict,
  allowRedaction = false,
}: {
  onImagesChange: (urls: string[]) => void;
  onVideoChange: (video: { videoUrl: string; thumbnailUrl: string } | null) => void;
  onVideoStatusChange?: (status: VideoUploadStatus) => void;
  dict: Dictionary;
  allowRedaction?: boolean;
}) {
  const [tab, setTab] = useState<MediaTab>("photo");

  function tabClass(isActive: boolean) {
    return `flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
      isActive ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
    }`;
  }

  return (
    <div>
      <div className="flex gap-1 rounded-xl bg-bg-elevated p-1">
        <button type="button" onClick={() => setTab("photo")} className={tabClass(tab === "photo")}>
          <ImagePlus className="h-3.5 w-3.5" />
          {dict.postListing.mediaPhotoTab}
        </button>
        <button type="button" onClick={() => setTab("video")} className={tabClass(tab === "video")}>
          <Video className="h-3.5 w-3.5" />
          {dict.postListing.mediaVideoTab}
        </button>
      </div>
      <div className="mt-3">
        {tab === "photo" ? (
          <ImageUploader onChange={onImagesChange} dict={dict} allowRedaction={allowRedaction} />
        ) : (
          <VideoUploader onChange={onVideoChange} onStatusChange={onVideoStatusChange} dict={dict} />
        )}
      </div>
    </div>
  );
}
