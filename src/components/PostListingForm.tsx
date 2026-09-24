"use client";

import { useState, type FormEvent } from "react";
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

type Status = "idle" | "submitting" | "success";

export default function PostListingForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [kind, setKind] = useState<ListingKind>("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryId>("hujjatlar");
  const [city, setCity] = useState(cities[0]);
  const [reward, setReward] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setLocateError(dict.postListing.locateMeError);
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocateError(dict.postListing.locateMeError);
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
    setCity(cities[0]);
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
                {dict.postListing.cityLabel}
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-9 py-2.5 text-sm focus:outline-none"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
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
