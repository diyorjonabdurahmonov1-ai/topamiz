"use client";

import { useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import type { CategoryId, ListingKind } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatPostSuccessBody } from "@/lib/i18n/format";
import { categories, cities } from "@/lib/data";
import ImageUploader from "./ImageUploader";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-bg-elevated">
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
    </div>
  ),
});

type Status = "idle" | "submitting" | "success";

export default function PostListingForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [kind, setKind] = useState<ListingKind>("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryId>("hujjatlar");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [reward, setReward] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [detecting, setDetecting] = useState(false);

  async function handleCoordsChange(next: { lat: number; lng: number }) {
    setCoords(next);
    setDetecting(true);
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${next.lat}&lng=${next.lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.city && cities.includes(data.city)) setCity(data.city);
        if (data.district) setDistrict(data.district);
      }
    } catch {
      // Reverse geocoding is a convenience, not a requirement — the poster
      // can still fill city/district in manually if this fails.
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
        // A browser never re-shows its permission prompt after the visitor
        // has already denied it once — the only way forward is for them to
        // flip it back on themselves in the browser's own site settings.
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !contactName.trim() || !contactPhone.trim()) {
      setError(dict.postListing.requiredFieldsError);
      return;
    }
    if (!city) {
      setError(dict.postListing.locationRequiredError);
      return;
    }
    setError("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title,
          description,
          category,
          city,
          district: district.trim() || undefined,
          reward: reward ? Number(reward) : null,
          contactName,
          contactPhone,
          photoUrls: imageUrls,
          lat: coords?.lat,
          lng: coords?.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? dict.postListing.genericError);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.postListing.genericError);
      setStatus("idle");
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("hujjatlar");
    setCity("");
    setDistrict("");
    setReward("");
    setContactName("");
    setContactPhone("");
    setImageUrls([]);
    setStatus("idle");
    setCoords(null);
    setLocateError("");
  }

  if (status === "success") {
    const kindLabel = kind === "lost" ? dict.postListing.successKindLost : dict.postListing.successKindFound;
    return (
      <div className="animate-fade-up flex flex-col items-center rounded-3xl border border-border bg-surface p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold">{dict.postListing.successTitle}</h2>
        <p className="mt-2 max-w-md text-sm text-muted">
          {formatPostSuccessBody(locale, kindLabel, title)}
        </p>
        {imageUrls.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {imageUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded to /public at runtime, not a build-time asset
              <img
                key={url}
                src={url}
                alt=""
                className="h-20 w-20 rounded-xl border border-border object-cover"
              />
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-2"
          >
            {dict.postListing.postAnother}
          </button>
          <Link
            href="/elonlar"
            className="btn-brand rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            {dict.postListing.viewAllListings}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-bold">{dict.postListing.itemTypeHeading}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(
            [
              { id: "lost", label: dict.postListing.lostOption },
              { id: "found", label: dict.postListing.foundOption },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setKind(opt.id)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                kind === opt.id
                  ? "border-brand-via bg-brand-via/10 text-foreground"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-bold">{dict.postListing.mainInfoHeading}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              {dict.postListing.titleLabel}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={dict.postListing.titlePlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              {dict.postListing.descriptionLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={dict.postListing.descriptionPlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">
                {dict.postListing.categoryLabel}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {dict.categories[c.id]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">
                {dict.postListing.districtLabel}
              </label>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={dict.postListing.districtPlaceholder}
                className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-muted">{dict.postListing.mapPickerHint}</p>
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
          {dict.postListing.photosHeading}
        </h2>
        <div className="mt-3">
          <ImageUploader onChange={setImageUrls} />
        </div>
      </div>

      {kind === "lost" && (
        <div className="rounded-2xl border border-accent-gold/30 bg-accent-gold/5 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-accent-gold">
            <Sparkles className="h-4 w-4" />
            {dict.postListing.rewardHeading}
          </h2>
          <p className="mt-1 text-xs text-muted">{dict.postListing.rewardHint}</p>
          <input
            type="number"
            min={0}
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder={dict.postListing.rewardPlaceholder}
            className="mt-3 w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
          />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-bold">{dict.postListing.contactHeading}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              {dict.postListing.nameLabel}
            </label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder={dict.postListing.namePlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              {dict.postListing.phoneLabel}
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder={dict.postListing.phonePlaceholder}
                className="w-full rounded-xl border border-border bg-bg-elevated px-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white disabled:opacity-70"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {dict.postListing.submitting}
          </>
        ) : (
          dict.postListing.submit
        )}
      </button>
    </form>
  );
}
