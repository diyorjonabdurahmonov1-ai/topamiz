"use client";

import { useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ImagePlus,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Phone,
  Tag,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { PromoCategoryId } from "@/lib/types";
import { cities, promoCategories } from "@/lib/data";
import MediaUploader from "./MediaUploader";
import type { VideoUploadStatus } from "./VideoUploader";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-bg-elevated">
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
    </div>
  ),
});

type Status = "idle" | "submitting" | "waiting-for-video" | "success";

export default function PromoForm({ dict }: { dict: Dictionary }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tariffs, setTariffs] = useState("");
  const [promoCategory, setPromoCategory] = useState<PromoCategoryId>(promoCategories[0].id);
  const [city, setCity] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [video, setVideo] = useState<{ videoUrl: string; thumbnailUrl: string } | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoUploadStatus>("idle");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [detecting, setDetecting] = useState(false);
  const waitingForVideoRef = useRef(false);

  async function handleCoordsChange(next: { lat: number; lng: number }) {
    setCoords(next);
    setDetecting(true);
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${next.lat}&lng=${next.lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.city && cities.includes(data.city)) setCity(data.city);
      }
    } catch {
      // Reverse geocoding is a convenience — a picked point without a
      // resolved city is still blocked at submit time below.
    } finally {
      setDetecting(false);
    }
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setLocateError(dict.postListing.locateMeError);
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleCoordsChange({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? dict.postListing.locateMePermissionDenied
            : dict.postListing.locateMeError
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submitPromo() {
    setStatus("submitting");
    try {
      const res = await fetch("/api/listings/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          tariffs,
          promoCategory,
          city,
          contactPhone,
          photoUrls: imageUrls,
          videoUrl: video?.videoUrl,
          videoThumbnailUrl: video?.thumbnailUrl,
          lat: coords?.lat,
          lng: coords?.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? dict.promoForm.genericError);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.promoForm.genericError);
      setStatus("idle");
    }
  }

  function handleVideoStatusChange(next: VideoUploadStatus) {
    setVideoStatus(next);
    if (!waitingForVideoRef.current) return;
    if (next === "done") {
      waitingForVideoRef.current = false;
      void submitPromo();
    } else if (next === "error") {
      waitingForVideoRef.current = false;
      setStatus("idle");
      setError(dict.postListing.videoBlockingError);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError(dict.promoForm.requiredFieldsError);
      return;
    }
    if (videoStatus === "error") {
      setError(dict.postListing.videoBlockingError);
      return;
    }
    setError("");
    if (videoStatus === "checking" || videoStatus === "uploading") {
      waitingForVideoRef.current = true;
      setStatus("waiting-for-video");
      return;
    }
    void submitPromo();
  }

  if (status === "success") {
    return (
      <div className="animate-fade-up flex flex-col items-center rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-brand-via/5 to-transparent p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-brand-via text-white">
          <Tag className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold">{dict.promoForm.successTitle}</h2>
        <p className="mt-2 max-w-md text-sm text-muted">{dict.promoForm.successBody}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/takliflar" className="btn-brand rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
            {dict.promoForm.viewPromoLink}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-sky-500">
          <Info className="h-4 w-4" />
          {dict.promoForm.explainHeading}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{dict.promoForm.explainBody}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-bold">{dict.postListing.mainInfoHeading}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              {dict.promoForm.titleLabel}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={dict.promoForm.titlePlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              {dict.promoForm.descriptionLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={dict.promoForm.descriptionPlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              {dict.promoForm.categoryLabel}
            </label>
            <select
              value={promoCategory}
              onChange={(e) => setPromoCategory(e.target.value as PromoCategoryId)}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none"
            >
              {promoCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {dict.promoCategories[c.id]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              {dict.promoForm.tariffsLabel}
            </label>
            <textarea
              value={tariffs}
              onChange={(e) => setTariffs(e.target.value)}
              rows={2}
              placeholder={dict.promoForm.tariffsPlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>

          <div>
            <p className="mb-2 text-xs text-muted">{dict.promoForm.mapPickerHint}</p>
            <LocationPickerMap value={coords} onChange={handleCoordsChange} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={locating}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-70 ${
                  coords
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {locating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="h-3.5 w-3.5" />
                )}
                {coords ? dict.postListing.locateMeSuccess : dict.postListing.locateMeButton}
              </button>
              {detecting && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {dict.postListing.detectingLocation}
                </span>
              )}
              {!detecting && city && (
                <span className="flex items-center gap-1.5 rounded-xl border border-success/40 bg-success/10 px-3.5 py-2 text-xs font-semibold text-success">
                  <MapPin className="h-3.5 w-3.5" />
                  {city}
                </span>
              )}
            </div>
            {locateError && <p className="mt-1.5 text-xs font-medium text-danger">{locateError}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <ImagePlus className="h-4 w-4" />
          {dict.postListing.mediaHeading}
        </h2>
        <p className="mt-1 text-xs text-muted">{dict.postListing.mediaHint}</p>
        <div className="mt-3">
          <MediaUploader
            onImagesChange={setImageUrls}
            onVideoChange={setVideo}
            onVideoStatusChange={handleVideoStatusChange}
            dict={dict}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-bold">{dict.promoForm.contactHeading}</h2>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted">
            {dict.promoForm.phoneLabel}
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder={dict.postListing.phonePlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || status === "waiting-for-video"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-brand-via px-5 py-3.5 text-sm font-bold text-white disabled:opacity-70"
      >
        {status === "submitting" || status === "waiting-for-video" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {status === "waiting-for-video" ? dict.postListing.waitingForVideo : dict.promoForm.submitting}
          </>
        ) : (
          <>
            <Tag className="h-4 w-4" />
            {dict.promoForm.submit}
          </>
        )}
      </button>

      <Link
        href="/elon-qoshish"
        className="block text-center text-xs font-semibold text-muted hover:text-foreground"
      >
        {dict.promoForm.backToNormalLink}
      </Link>
    </form>
  );
}
