"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type Ref } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Gift,
  ListPlus,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  PackageSearch,
  PartyPopper,
  Phone,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import type { CategoryId, ListingKind } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatPostSuccessBody } from "@/lib/i18n/format";
import { categories, cities } from "@/lib/data";
import { categoryIcons } from "@/lib/icons";
import { CATEGORY_COLORS } from "@/lib/category-colors";
import { guessCategory } from "@/lib/guess-category";
import MediaUploader from "./MediaUploader";
import {
  cancelVideoUpload,
  getVideoUpload,
  markVideoSubmitted,
  videoFieldsForListing,
} from "@/lib/video-upload-store";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-bg-elevated">
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
    </div>
  ),
});

type Status = "idle" | "submitting" | "success";

const inputClass =
  "w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm focus:border-brand-via/50 focus:outline-none focus:ring-2 focus:ring-brand-via/30";

// Posting asks for two things — what and where — and everything else is
// optional, tucked under "more details". The category is guessed from the
// title as the poster types; picking a tile overrides the guess.
export default function PostListingForm({
  dict,
  locale,
  defaultPhone,
}: {
  dict: Dictionary;
  locale: Locale;
  defaultPhone: string;
}) {
  const t = dict.postListing;
  const [kind, setKind] = useState<ListingKind>("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pickedCategory, setPickedCategory] = useState<CategoryId | null>(null);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [reward, setReward] = useState("");
  const [contactPhone, setContactPhone] = useState(defaultPhone);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoHandle, setVideoHandle] = useState<string | null>(null);
  const [videoPending, setVideoPending] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [errorStep, setErrorStep] = useState<"what" | "where" | null>(null);
  const [postedId, setPostedId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showMore, setShowMore] = useState(false);
  // Leaving the form without publishing drops its upload; a published
  // listing's upload is never dropped (cancelVideoUpload checks that).
  const videoHandleRef = useRef<string | null>(null);
  useEffect(() => {
    videoHandleRef.current = videoHandle;
  }, [videoHandle]);
  useEffect(() => () => cancelVideoUpload(videoHandleRef.current), []);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [detecting, setDetecting] = useState(false);
  const whatRef = useRef<HTMLElement>(null);
  const whereRef = useRef<HTMLElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const guessedCategory = guessCategory(title);
  const category: CategoryId = pickedCategory ?? guessedCategory ?? "boshqa";
  const whatDone = title.trim().length > 0;
  const whereDone = !!city || !!coords;

  async function handleCoordsChange(next: { lat: number; lng: number }) {
    setCoords(next);
    if (errorStep === "where") clearError();
    setDetecting(true);
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${next.lat}&lng=${next.lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.city && cities.includes(data.city)) setCity(data.city);
        setDistrict(data.district ?? "");
      }
    } catch {
      // Reverse geocoding is a convenience, not a requirement — the server
      // falls back to the nearest city for a point it couldn't name.
    } finally {
      setDetecting(false);
    }
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setLocateError(t.locateMeError);
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleCoordsChange({ lat: position.coords.latitude, lng: position.coords.longitude });
        setShowMap(true);
        setLocating(false);
      },
      (err) => {
        // A browser never re-shows its permission prompt after the visitor
        // has already denied it once — the only way forward is for them to
        // flip it back on themselves in the browser's own site settings.
        setLocateError(err.code === err.PERMISSION_DENIED ? t.locateMePermissionDenied : t.locateMeError);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // A city chip is the one-tap "roughly here": it replaces any map point,
  // which may well have been in another city.
  function pickCity(next: string) {
    setCity(next);
    if (errorStep === "where") clearError();
    setCoords(null);
    setDistrict("");
    setShowMap(false);
  }

  function clearError() {
    setError("");
    setErrorStep(null);
  }

  function failOn(step: "what" | "where", message: string) {
    setError(message);
    setErrorStep(step);
    const ref = step === "what" ? whatRef : whereRef;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (step === "what") titleInputRef.current?.focus({ preventScroll: true });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!whatDone) return failOn("what", t.requiredFieldsError);
    if (!whereDone) return failOn("where", t.locationRequiredError);
    if (getVideoUpload(videoHandle)?.stage === "error") {
      setError(t.videoBlockingError);
      setErrorStep(null);
      return;
    }
    setError("");
    setErrorStep(null);
    setStatus("submitting");
    try {
      // A video still uploading doesn't hold the post up: the listing is
      // published now and the video is attached as soon as it's ready.
      let videoFields;
      try {
        videoFields = await videoFieldsForListing(videoHandle);
      } catch {
        throw new Error(t.videoBlockingError);
      }
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title,
          description,
          category,
          city: city || undefined,
          district: district.trim() || undefined,
          reward: kind === "lost" && reward ? Number(reward) : null,
          contactPhone,
          photoUrls: imageUrls,
          ...videoFields,
          lat: coords?.lat,
          lng: coords?.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.genericError);
      if (videoHandle && videoFields.videoUploadId) {
        void markVideoSubmitted(videoHandle, String(data.listing.id));
        setVideoPending(true);
      }
      setPostedId(String(data.listing.id));
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
      setStatus("idle");
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setPickedCategory(null);
    setCity("");
    setDistrict("");
    setReward("");
    setContactPhone(defaultPhone);
    setImageUrls([]);
    setVideoHandle(null);
    setVideoPending(false);
    setPostedId(null);
    setStatus("idle");
    setCoords(null);
    setShowMap(false);
    setShowMore(false);
    setLocateError("");
  }

  if (status === "success") {
    const kindLabel = kind === "lost" ? t.successKindLost : t.successKindFound;
    return (
      <div className="animate-fade-up relative overflow-hidden rounded-3xl border border-border bg-surface p-8 text-center sm:p-10">
        <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-72 rounded-full bg-gradient-to-r from-brand-from via-brand-via to-brand-to opacity-20 blur-3xl" />
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-success to-emerald-400 text-white shadow-lg shadow-success/30">
          <PartyPopper className="h-9 w-9" />
        </div>
        <h2 className="relative mt-5 text-2xl font-extrabold">{t.successTitle}</h2>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-muted">
          {formatPostSuccessBody(locale, kindLabel, title)}
        </p>
        {videoPending && <p className="relative mx-auto mt-2 max-w-md text-xs text-muted">{t.videoPostedPending}</p>}
        {imageUrls.length > 0 && (
          <div className="relative mt-5 flex flex-wrap justify-center gap-3">
            {imageUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime, not a build-time asset
              <img key={url} src={url} alt="" className="h-20 w-20 rounded-xl border border-border object-cover" />
            ))}
          </div>
        )}
        <div className="relative mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          {postedId && (
            <Link
              href={`/elonlar/${postedId}`}
              className="btn-brand rounded-xl px-5 py-3 text-sm font-bold text-white"
            >
              {t.viewListing}
            </Link>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold hover:bg-surface-2"
          >
            {t.postAnother}
          </button>
        </div>
        <Link href="/elonlar" className="relative mt-4 inline-block text-xs font-semibold text-muted hover:text-foreground">
          {t.viewAllListings}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Step number={1} done title={t.stepKindTitle} badge={t.requiredBadge}>
        <div className="grid grid-cols-2 gap-3">
          <KindOption
            active={kind === "lost"}
            onClick={() => setKind("lost")}
            icon={<Search className="h-5 w-5" />}
            title={t.lostOption}
            hint={t.lostOptionHint}
            tone="from-orange-500 to-rose-500"
            soft="bg-orange-500/10 text-orange-600 dark:text-orange-300"
          />
          <KindOption
            active={kind === "found"}
            onClick={() => setKind("found")}
            icon={<PackageSearch className="h-5 w-5" />}
            title={t.foundOption}
            hint={t.foundOptionHint}
            tone="from-sky-500 to-brand-from"
            soft="bg-sky-500/10 text-sky-600 dark:text-sky-300"
          />
        </div>
      </Step>

      <Step
        ref={whatRef}
        number={2}
        done={whatDone}
        title={kind === "lost" ? t.stepWhatLost : t.stepWhatFound}
        badge={t.requiredBadge}
        shake={errorStep === "what"}
      >
        <input
          ref={titleInputRef}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errorStep === "what") clearError();
          }}
          aria-label={t.titleLabel}
          placeholder={kind === "lost" ? t.titlePlaceholder : t.titlePlaceholderFound}
          maxLength={120}
          className={`${inputClass} text-base font-semibold ${errorStep === "what" ? "border-danger ring-2 ring-danger/30" : ""}`}
        />
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {categories.map((c) => {
            const Icon = categoryIcons[c.id];
            const colors = CATEGORY_COLORS[c.id];
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setPickedCategory(c.id)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2 text-center transition-all active:scale-95 ${
                  active ? "border-transparent bg-surface-2 shadow-sm" : "border-border hover:bg-surface-2"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                    active ? "text-white shadow-md" : "bg-surface-2 text-muted"
                  }`}
                  style={active ? { backgroundImage: `linear-gradient(135deg, ${colors.from}, ${colors.to})` } : undefined}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className={`line-clamp-2 text-[10.5px] font-semibold leading-tight ${active ? "text-foreground" : "text-muted"}`}>
                  {dict.categories[c.id]}
                </span>
              </button>
            );
          })}
        </div>
        {!pickedCategory && guessedCategory && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-brand-via">
            <Sparkles className="h-3 w-3" />
            {t.categoryAutoHint}
          </p>
        )}
      </Step>

      <Step
        ref={whereRef}
        number={3}
        done={whereDone}
        title={kind === "lost" ? t.stepWhereLost : t.stepWhereFound}
        badge={t.requiredBadge}
        hint={t.whereHint}
        shake={errorStep === "where"}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold transition-all disabled:opacity-70 sm:text-sm ${
              coords
                ? "border border-success/40 bg-success/10 text-success"
                : "btn-brand text-white"
            }`}
          >
            {locating ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <LocateFixed className="h-4 w-4 shrink-0" />}
            <span className="text-left leading-tight">{coords ? t.locateMeSuccess : t.locateMeButton}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition-colors sm:text-sm ${
              showMap ? "border-brand-via/40 bg-brand-via/10 text-foreground" : "border-border hover:bg-surface-2"
            }`}
          >
            {showMap ? <X className="h-4 w-4 shrink-0" /> : <MapIcon className="h-4 w-4 shrink-0" />}
            <span className="text-left leading-tight">{showMap ? t.hideMap : t.pickOnMap}</span>
          </button>
        </div>

        {showMap && (
          <div className="mt-3">
            <p className="mb-2 text-xs text-muted">{t.mapPickerHint}</p>
            <LocationPickerMap value={coords} onChange={handleCoordsChange} />
          </div>
        )}

        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cities.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pickCity(c)}
              aria-pressed={city === c}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                city === c
                  ? "border-transparent bg-foreground text-bg"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {city === c && <MapPin className="h-3 w-3" />}
              {c}
            </button>
          ))}
        </div>

        {(detecting || (coords && city)) && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
            {detecting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
                <span className="text-muted">{t.detectingLocation}</span>
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5" />
                {[city, district].filter(Boolean).join(", ")}
              </>
            )}
          </p>
        )}
        {locateError && <p className="mt-2 text-xs font-medium text-danger">{locateError}</p>}
      </Step>

      <Step number={4} done={imageUrls.length > 0 || !!videoHandle} title={t.stepMediaTitle} badge={t.optionalBadge} optional hint={t.stepMediaHint}>
        <MediaUploader
          onImagesChange={setImageUrls}
          videoHandle={videoHandle}
          onVideoHandleChange={setVideoHandle}
          dict={dict}
          allowRedaction={category === "hujjatlar"}
        />
      </Step>

      <Step number={5} done={!!contactPhone.trim()} title={t.contactHeading} badge={t.optionalBadge} optional>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="tel"
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            aria-label={t.phoneLabel}
            placeholder={t.phonePlaceholder}
            className={`${inputClass} pl-10 ${contactPhone ? "pr-10" : ""}`}
          />
          {contactPhone && (
            <button
              type="button"
              onClick={() => setContactPhone("")}
              aria-label={dict.common.close}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">{t.phoneOptionalHint}</p>
      </Step>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
            <ListPlus className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">{t.moreDetailsTitle}</span>
            <span className="block truncate text-xs text-muted">{t.moreDetailsHint}</span>
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition-transform ${showMore ? "rotate-180" : ""}`} />
        </button>
        {showMore && (
          <div className="animate-fade-in space-y-4 border-t border-border p-4 sm:p-5">
            <div>
              <label htmlFor="post-description" className="mb-1.5 block text-xs font-semibold text-muted">
                {t.descriptionLabel}
              </label>
              <textarea
                id="post-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={t.descriptionPlaceholder}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="post-district" className="mb-1.5 block text-xs font-semibold text-muted">
                {t.districtLabel}
              </label>
              <input
                id="post-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={t.districtPlaceholder}
                className={inputClass}
              />
            </div>
            {kind === "lost" && (
              <div className="rounded-2xl border border-accent-gold/30 bg-accent-gold/5 p-4">
                <label htmlFor="post-reward" className="flex items-center gap-1.5 text-sm font-bold text-accent-gold">
                  <Gift className="h-4 w-4" />
                  {t.rewardHeading}
                </label>
                <p className="mt-1 text-xs text-muted">{t.rewardHint}</p>
                <input
                  id="post-reward"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder={t.rewardPlaceholder}
                  className={`${inputClass} mt-3 focus:ring-accent-gold/40`}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="animate-fade-in rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-xs font-semibold text-muted">{t.readyLabel}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-from via-brand-via to-success transition-all duration-500"
              style={{ width: `${(Number(whatDone) + Number(whereDone)) * 50}%` }}
            />
          </div>
          <span className={`text-xs font-extrabold ${whatDone && whereDone ? "text-success" : "text-muted"}`}>
            {Number(whatDone) + Number(whereDone)}/2
          </span>
        </div>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-brand flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-extrabold text-white disabled:opacity-70"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t.submitting}
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              {t.submit}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Step({
  ref,
  number,
  done,
  title,
  badge,
  hint,
  optional = false,
  shake = false,
  children,
}: {
  ref?: Ref<HTMLElement>;
  number: number;
  done: boolean;
  title: string;
  badge: string;
  hint?: string;
  optional?: boolean;
  shake?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      ref={ref}
      className={`scroll-mt-24 rounded-3xl border bg-surface p-4 transition-colors sm:p-5 ${
        shake ? "animate-shake border-danger/50" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-all ${
            done
              ? "bg-success text-white shadow-md shadow-success/30"
              : optional
                ? "bg-surface-2 text-muted"
                : "bg-gradient-to-br from-brand-from to-brand-via text-white shadow-md shadow-brand-via/30"
          }`}
        >
          {done ? <Check className="h-4 w-4" strokeWidth={3} /> : number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold">{title}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                optional ? "bg-surface-2 text-muted" : "bg-brand-via/10 text-brand-via"
              }`}
            >
              {badge}
            </span>
          </div>
          {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function KindOption({
  active,
  onClick,
  icon,
  title,
  hint,
  tone,
  soft,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  hint: string;
  tone: string;
  soft: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex flex-col items-start overflow-hidden rounded-2xl p-3.5 text-left transition-all active:scale-[0.98] sm:p-4 ${
        active
          ? `bg-gradient-to-br ${tone} text-white shadow-lg`
          : "border border-border bg-bg-elevated hover:bg-surface-2"
      }`}
    >
      {active && (
        <>
          <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15" />
          <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-900">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        </>
      )}
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-white/20 text-white" : soft}`}>
        {icon}
      </span>
      <span className="mt-2.5 text-sm font-extrabold leading-tight">{title}</span>
      <span className={`mt-0.5 text-[11px] leading-snug ${active ? "text-white/85" : "text-muted"}`}>{hint}</span>
    </button>
  );
}
