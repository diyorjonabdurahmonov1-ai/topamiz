"use client";

import { useRef, useState } from "react";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";

interface UploadImage {
  id: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  url?: string;
  error?: string;
}

const MAX_IMAGES = 5;

export default function ImageUploader({
  onChange,
}: {
  onChange?: (urls: string[]) => void;
}) {
  const [images, setImages] = useState<UploadImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function report(list: UploadImage[]) {
    onChange?.(list.filter((img) => img.status === "done" && img.url).map((img) => img.url!));
  }

  async function uploadFile(id: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yuklashda xatolik yuz berdi");
      setImages((prev) => {
        const next = prev.map((img) =>
          img.id === id ? { ...img, status: "done" as const, url: data.url as string } : img
        );
        report(next);
        return next;
      });
    } catch (err) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? {
                ...img,
                status: "error" as const,
                error: err instanceof Error ? err.message : "Yuklashda xatolik",
              }
            : img
        )
      );
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const room = MAX_IMAGES - images.length;
    const files = Array.from(fileList).slice(0, room);

    const added: UploadImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }));
    setImages((prev) => [...prev, ...added]);
    added.forEach((img, i) => uploadFile(img.id, files[i]));
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      report(next);
      return next;
    });
  }

  const canAddMore = images.length < MAX_IMAGES;

  return (
    <div>
      {canAddMore && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
          }}
          role="button"
          tabIndex={0}
          className={`flex h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center text-sm transition-colors ${
            dragActive
              ? "border-brand-via bg-brand-via/5 text-foreground"
              : "border-border text-muted hover:border-brand-via/40 hover:text-foreground"
          }`}
        >
          <ImagePlus className="h-5 w-5" />
          Rasmni shu yerga tashlang yoki bosib tanlang
          <span className="text-xs text-muted">JPG, PNG, WEBP · 5MB gacha · {MAX_IMAGES} tagacha</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-bg-elevated"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote asset */}
              <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
              {img.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
              {img.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 p-1.5 text-center">
                  <AlertCircle className="h-4 w-4 text-danger" />
                  <span className="text-[10px] leading-tight text-white">{img.error}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                aria-label="Rasmni o'chirish"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
