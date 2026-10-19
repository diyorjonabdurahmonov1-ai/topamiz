"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode, type Ref } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  Gift,
  House,
  ListPlus,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  PackageSearch,
  PartyPopper,
  Phone,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Tags,
  Wrench,
  X,
} from "lucide-react";
import type { CategoryId, Currency, ListingKind } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatPostSuccessBody } from "@/lib/i18n/format";
import { cities } from "@/lib/data";
import {
  categoriesFor,
  defaultCategory,
  defaultCurrency,
  fieldsFor,
  isCategoryAllowed,
  isLostFound,
  kindHasPrice,
  LISTING_KINDS,
  type FieldDef,
} from "@/lib/sections";
import { priceLabel } from "@/lib/listing-labels";
import { categoryIcons } from "@/lib/icons";
import { CATEGORY_COLORS } from "@/lib/category-colors";
import { guessCategory } from "@/lib/guess-category";
import MediaUploader from "./MediaUploader";
import {
  cancelVideoUpload,
  getVideoUpload,
  markVideoSubmitted,
  restoreFinishedVideo,
  startVideoUpload,
  useVideoUpload,
  videoFieldsForListing,
  videoFileFor,
} from "@/lib/video-upload-store";
import {
  clearDraft,
  deleteDraftVideo,
  loadDraft,
  loadDraftVideo,
  saveDraft,
  saveDraftVideo,
} from "@/lib/listing-draft";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-bg-elevated">
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
    </div>
  ),
});

type Status = "idle" | "submitting" | "success";

// Fields use their own tokens (globals.css) so they stand out from the card
// in both themes; in dark mode the card colours left them almost invisible.
const inputClass =
  "w-full rounded-xl border border-field-border bg-field px-4 py-3 text-sm placeholder:text-muted focus:border-brand-via focus:outline-none focus:ring-2 focus:ring-brand-via/30";
// A required field that's still empty gets the brand colour, so nobody
// scrolls past it thinking it's optional.
const requiredEmptyClass = "border-brand-via/70 ring-1 ring-brand-via/25";

// Posting asks for two things — what and where — and everything else is
// optional: the price and category fields, photos or a video, the phone.
// The kind (sell, rent, job, service, lost, found) decides which categories
// and fields are offered (lib/sections.ts). The category is guessed from the
// title as the poster types; picking a tile overrides the guess.
//
// Two screens: first only the kinds, then — once one is tapped — the form
// for it, as its own screen with a way back. A first-time poster who just
// saw a tile change colour didn't know what to do next. The pick is pushed
// to the history (?kind=), so the phone's back button returns to the kinds.
export default function PostListingForm({
  dict,
  locale,
  defaultPhone,
  initialKind,
  pickFooter,
}: {
  dict: Dictionary;
  locale: Locale;
  defaultPhone: string;
  // Set when a link already says which kind (?kind=lost): open on the form.
  initialKind?: ListingKind;
  // Shown under the kinds on the first screen only (the other listing types).
  pickFooter?: ReactNode;
}) {
  const t = dict.postListing;
  const c = dict.classifieds;
  const [kind, setKind] = useState<ListingKind>(initialKind ?? "sell");
  const [phase, setPhase] = useState<"pick" | "form">(initialKind ? "form" : "pick");
  const pushedRef = useRef(false);
  const formTopRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState("");
  const [pickedCurrency, setPickedCurrency] = useState<Currency | null>(null);
  const [negotiable, setNegotiable] = useState(false);
  const [attrs, setAttrs] = useState<Record<string, string>>({});
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
  // Leaving the form keeps its video uploading — it's part of the draft
  // below, and the form picks it up again on return.
  const videoEntry = useVideoUpload(videoHandle);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [detecting, setDetecting] = useState(false);
  const whatRef = useRef<HTMLElement>(null);
  const whereRef = useRef<HTMLElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  // The draft (lib/listing-draft): restored once on arrival, then saved on
  // every change. Saving waits for the restore (state, not a ref: the first
  // render's effects must still see "not ready"), or the empty first render
  // would wipe what's being restored.
  const draftIdRef = useRef("");
  const [draftReady, setDraftReady] = useState(false);
  // A reload cut a video off and its copy is being read back.
  const [restoringVideo, setRestoringVideo] = useState(false);
  const savedVideoRef = useRef<string | null>(null);
  const [restored, setRestored] = useState(false);
  // Remounts the photo uploader with the restored photos.
  const [mediaKey, setMediaKey] = useState(0);

  // Before the first paint, so a restored draft opens straight on the form
  // instead of flashing the kinds screen first.
  useLayoutEffect(() => {
    const draft = loadDraft();
    // sessionStorage only exists in the browser, so this can't be initial
    // state without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftReady(true);
    if (!draft) {
      draftIdRef.current = crypto.randomUUID();
      void deleteDraftVideo();
      return;
    }
    draftIdRef.current = draft.id;
    setKind(initialKind ?? draft.kind);
    setTitle(draft.title);
    setDescription(draft.description);
    setPickedCategory(draft.pickedCategory);
    setPrice(draft.price);
    setPickedCurrency(draft.pickedCurrency);
    setNegotiable(draft.negotiable);
    setAttrs(draft.attrs ?? {});
    setCity(draft.city);
    setDistrict(draft.district);
    setReward(draft.reward);
    setContactPhone(draft.contactPhone);
    setImageUrls(draft.imageUrls ?? []);
    setMediaKey((k) => k + 1);
    setCoords(draft.coords);
    if (draft.coords) setShowMap(true);
    if (Object.values(draft.attrs ?? {}).some(Boolean) || draft.description) setShowMore(true);
    setRestored(true);
    if (!initialKind) {
      setPhase("form");
      window.history.replaceState(null, "", `?kind=${draft.kind}`);
    }

    // Still uploading in this tab (moved between pages): carry on with it.
    // Finished before a reload: its result is enough. Cut off by a reload:
    // start again from the copy kept on the phone.
    const video = draft.video;
    if (video && getVideoUpload(video.handle)) {
      setVideoHandle(video.handle);
      savedVideoRef.current = video.handle;
    } else if (video?.result) {
      setVideoHandle(restoreFinishedVideo(video.result));
    } else if (video) {
      setRestoringVideo(true);
      void loadDraftVideo(draft.id)
        .then((stored) => {
          if (!stored) return;
          const handle = startVideoUpload(stored.file, stored.source, dict);
          savedVideoRef.current = handle;
          setVideoHandle((current) => current ?? handle);
        })
        .finally(() => setRestoringVideo(false));
    }
    // Only ever on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasContent =
    !!title.trim() ||
    !!description.trim() ||
    imageUrls.length > 0 ||
    !!videoHandle ||
    !!price ||
    negotiable ||
    Object.values(attrs).some(Boolean) ||
    !!city ||
    !!coords ||
    !!reward ||
    contactPhone !== defaultPhone;

  useEffect(() => {
    if (!draftReady || restoringVideo || status === "success") return;
    if (!hasContent) {
      clearDraft();
      return;
    }
    saveDraft({
      id: draftIdRef.current,
      kind,
      title,
      description,
      pickedCategory,
      price,
      pickedCurrency,
      negotiable,
      attrs,
      city,
      district,
      reward,
      contactPhone,
      imageUrls,
      coords,
      video: videoHandle ? { handle: videoHandle, result: videoEntry?.result ?? null } : null,
    });
  }, [
    draftReady,
    restoringVideo,
    hasContent,
    status,
    kind,
    title,
    description,
    pickedCategory,
    price,
    pickedCurrency,
    negotiable,
    attrs,
    city,
    district,
    reward,
    contactPhone,
    imageUrls,
    coords,
    videoHandle,
    videoEntry?.result,
  ]);

  // The video file itself, for a reload mid-upload: kept once it's been read
  // into memory, dropped once the upload is finished (the URLs do then).
  // (The store shows a preview as soon as the file is in memory.)
  const videoFileReady = !!videoEntry?.previewUrl;
  const videoDone = videoEntry?.stage === "done";
  useEffect(() => {
    if (!draftReady || restoringVideo) return;
    if (!videoHandle) {
      savedVideoRef.current = null;
      void deleteDraftVideo();
      return;
    }
    if (videoDone) {
      void deleteDraftVideo();
      return;
    }
    if (!videoFileReady || savedVideoRef.current === videoHandle) return;
    const picked = videoFileFor(videoHandle);
    if (!picked) return;
    savedVideoRef.current = videoHandle;
    void saveDraftVideo({ draftId: draftIdRef.current, handle: videoHandle, ...picked });
  }, [draftReady, restoringVideo, videoHandle, videoFileReady, videoDone]);

  // Starts over: the draft, its video and the form all go.
  function discardDraft() {
    cancelVideoUpload(videoHandle);
    clearDraft();
    draftIdRef.current = crypto.randomUUID();
    setRestored(false);
    resetForm();
  }

  useEffect(() => {
    function onPopState() {
      const next = new URLSearchParams(window.location.search).get("kind");
      pushedRef.current = false;
      if (next && (LISTING_KINDS as string[]).includes(next)) {
        setKind(next as ListingKind);
        setPhase("form");
      } else {
        setPhase("pick");
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Each screen starts at its top, like a new page; the form puts the cursor
  // in the first field, which is where the poster writes next.
  useEffect(() => {
    if (phase === "form") {
      formTopRef.current?.scrollIntoView({ block: "start" });
      titleInputRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  function chooseKind(next: ListingKind) {
    setKind(next);
    clearError();
    setPhase("form");
    window.history.pushState(null, "", `?kind=${next}`);
    pushedRef.current = true;
  }

  function backToKinds() {
    // Undo our own history entry so back/forward stay in step; when the
    // form was opened straight from a ?kind= link there's none to undo.
    if (pushedRef.current) {
      window.history.back();
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    setPhase("pick");
    window.scrollTo({ top: 0 });
  }

  const allowedCategories = categoriesFor(kind);
  const guessedCategory = guessCategory(title, allowedCategories);
  const category: CategoryId =
    (pickedCategory && isCategoryAllowed(kind, pickedCategory) ? pickedCategory : null) ??
    guessedCategory ??
    defaultCategory(kind);
  const currency: Currency = pickedCurrency ?? defaultCurrency(kind, category);
  const fields = fieldsFor(kind, category);
  const showDetails = kindHasPrice(kind) || fields.length > 0;
  const lostFound = isLostFound(kind);
  const whatTitle = { lost: t.stepWhatLost, found: t.stepWhatFound, sell: c.whatSell, rent: c.whatRent, job: c.whatJob, service: c.whatService }[kind];
  const whatPlaceholder = {
    lost: t.titlePlaceholder,
    found: t.titlePlaceholderFound,
    sell: c.placeholderSell,
    rent: c.placeholderRent,
    job: c.placeholderJob,
    service: c.placeholderService,
  }[kind];
  const whereTitle = kind === "lost" ? t.stepWhereLost : kind === "found" ? t.stepWhereFound : c.whereTitle;
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
    if (!whatDone) return failOn("what", lostFound ? t.requiredFieldsError : c.titleRequired);
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
          price: kindHasPrice(kind) && price ? Number(price) : null,
          currency,
          priceNegotiable: kindHasPrice(kind) && negotiable,
          attrs: Object.fromEntries(fields.map((f) => [f.key, attrs[f.key]]).filter(([, v]) => v)),
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
      clearDraft();
      setRestored(false);
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
    setPrice("");
    setPickedCurrency(null);
    setNegotiable(false);
    setAttrs({});
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
    setMediaKey((k) => k + 1);
    pushedRef.current = false;
    window.history.replaceState(null, "", window.location.pathname);
    setPhase("pick");
    window.scrollTo({ top: 0 });
  }

  if (status === "success") {
    const kindLabel = kind === "lost" ? t.successKindLost : t.successKindFound;
    const successBody = lostFound
      ? formatPostSuccessBody(locale, kindLabel, title)
      : c.successBodyGeneric.replace("{title}", title);
    return (
      <div className="animate-fade-up relative overflow-hidden rounded-3xl border border-border bg-surface p-8 text-center sm:p-10">
        <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-72 rounded-full bg-gradient-to-r from-brand-from via-brand-via to-brand-to opacity-20 blur-3xl" />
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-success to-emerald-400 text-white shadow-lg shadow-success/30">
          <PartyPopper className="h-9 w-9" />
        </div>
        <h2 className="relative mt-5 text-2xl font-extrabold">{t.successTitle}</h2>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-muted">
          {successBody}
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

  if (phase === "pick") {
    return (
      <div className="space-y-4">
        <section className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-lg font-extrabold">{c.kindQuestion}</h2>
          <p className="mt-0.5 text-xs text-muted">{c.kindPickHint}</p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {KIND_OPTIONS.filter((opt) => !opt.lostFound).map((opt) => (
              <KindOption
                key={opt.kind}
                onClick={() => chooseKind(opt.kind)}
                icon={<opt.icon className="h-5 w-5" />}
                title={opt.title(dict)}
                hint={opt.hint(dict)}
                soft={opt.soft}
              />
            ))}
          </div>
          {/* Lost & found on a tinted row of their own, so they don't get lost
              at the bottom of the list. */}
          <p className="mb-2 mt-4 text-xs font-bold text-muted">{c.lostFoundPrompt}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {KIND_OPTIONS.filter((opt) => opt.lostFound).map((opt) => (
              <KindOption
                key={opt.kind}
                onClick={() => chooseKind(opt.kind)}
                icon={<opt.icon className="h-5 w-5" />}
                title={opt.title(dict)}
                hint={opt.hint(dict)}
                soft={opt.soft}
                idle={opt.idle}
              />
            ))}
          </div>
        </section>
        {pickFooter}
      </div>
    );
  }

  const chosen = KIND_OPTIONS.find((opt) => opt.kind === kind) ?? KIND_OPTIONS[0];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div
        ref={formTopRef}
        className="animate-fade-in flex scroll-mt-20 items-center gap-3 rounded-3xl border border-border bg-surface p-3"
      >
        <button
          type="button"
          onClick={backToKinds}
          aria-label={c.changeKind}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${chosen.tone}`}>
          <chosen.icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold">{chosen.title(dict)}</span>
          <span className="block truncate text-[11px] text-muted">{chosen.hint(dict)}</span>
        </span>
        <button
          type="button"
          onClick={backToKinds}
          className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-bold text-brand-via hover:bg-brand-via/10"
        >
          {c.changeKind}
        </button>
      </div>

      {restored && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-2xl border border-brand-via/30 bg-brand-via/5 px-3.5 py-2.5">
          <Check className="h-4 w-4 shrink-0 text-brand-via" />
          <p className="min-w-0 flex-1 text-xs font-medium">{t.draftRestored}</p>
          <button
            type="button"
            onClick={discardDraft}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t.draftDiscard}
          </button>
        </div>
      )}

      <Step
        ref={whatRef}
        number={1}
        done={whatDone}
        title={whatTitle}
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
          placeholder={whatPlaceholder}
          maxLength={120}
          className={`${inputClass} text-base font-semibold ${
            errorStep === "what" ? "border-danger ring-2 ring-danger/30" : title.trim() ? "" : requiredEmptyClass
          }`}
        />
        {allowedCategories.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {allowedCategories.map((id) => {
            const Icon = categoryIcons[id];
            const colors = CATEGORY_COLORS[id];
            const active = category === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPickedCategory(id)}
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
                  {dict.categories[id]}
                </span>
              </button>
            );
          })}
        </div>
        )}
        {allowedCategories.length > 1 && !pickedCategory && guessedCategory && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-brand-via">
            <Sparkles className="h-3 w-3" />
            {t.categoryAutoHint}
          </p>
        )}
      </Step>

      {showDetails && (
        <Step number={2} done={!!price || negotiable || Object.values(attrs).some(Boolean)} title={c.detailsTitle} badge={t.optionalBadge} optional hint={c.detailsHint}>
          {kindHasPrice(kind) && (
            <div>
              <label htmlFor="post-price" className="mb-1.5 block text-xs font-semibold text-muted">
                {priceLabel(dict, kind)}
              </label>
              <div className="flex gap-2">
                <input
                  id="post-price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} flex-1 text-base font-semibold`}
                />
                <div className="flex shrink-0 rounded-xl border border-border bg-bg-elevated p-1" role="group" aria-label={priceLabel(dict, kind)}>
                  {(["UZS", "USD"] as const).map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setPickedCurrency(cur)}
                      aria-pressed={currency === cur}
                      className={`rounded-lg px-3 text-sm font-bold transition-colors ${
                        currency === cur ? "bg-foreground text-bg" : "text-muted hover:text-foreground"
                      }`}
                    >
                      {cur === "USD" ? "$" : c.currencyUZS}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-2.5 flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="h-4 w-4 accent-[var(--brand-via)]"
                />
                {c.negotiable}
              </label>
            </div>
          )}
          {fields.length > 0 && (
            <div className={`grid grid-cols-2 gap-3 ${kindHasPrice(kind) ? "mt-4 border-t border-border pt-4" : ""}`}>
              {fields.map((field) => (
                <AttrInput
                  key={field.key}
                  field={field}
                  label={c.attrs[field.key]}
                  options={c.options}
                  unit={field.type === "number" && field.unit ? (field.unit === "km" ? c.unitKm : c.unitM2) : undefined}
                  value={attrs[field.key] ?? ""}
                  onChange={(value) => setAttrs((prev) => ({ ...prev, [field.key]: value }))}
                />
              ))}
            </div>
          )}
        </Step>
      )}

      <Step
        ref={whereRef}
        number={showDetails ? 3 : 2}
        done={whereDone}
        title={whereTitle}
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

      <Step number={showDetails ? 4 : 3} done={imageUrls.length > 0 || !!videoHandle} title={t.stepMediaTitle} badge={t.optionalBadge} optional hint={t.stepMediaHint}>
        <MediaUploader
          key={mediaKey}
          onImagesChange={setImageUrls}
          imageUrls={imageUrls}
          videoHandle={videoHandle}
          onVideoHandleChange={setVideoHandle}
          dict={dict}
          allowRedaction={category === "hujjatlar"}
        />
      </Step>

      <Step number={showDetails ? 5 : 4} done={!!contactPhone.trim()} title={t.contactHeading} badge={t.optionalBadge} optional>
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

const KIND_OPTIONS: {
  kind: ListingKind;
  icon: typeof Tags;
  title: (d: Dictionary) => string;
  hint: (d: Dictionary) => string;
  tone: string;
  soft: string;
  lostFound?: boolean;
  // Background while not selected, for the lost & found pair.
  idle?: string;
}[] = [
  { kind: "sell", icon: Tags, title: (d) => d.classifieds.optSellTitle, hint: (d) => d.classifieds.optSellHint, tone: "from-emerald-500 to-teal-500", soft: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" },
  { kind: "rent", icon: House, title: (d) => d.classifieds.optRentTitle, hint: (d) => d.classifieds.optRentHint, tone: "from-teal-500 to-sky-500", soft: "bg-teal-500/10 text-teal-600 dark:text-teal-300" },
  { kind: "job", icon: BriefcaseBusiness, title: (d) => d.classifieds.optJobTitle, hint: (d) => d.classifieds.optJobHint, tone: "from-blue-600 to-brand-via", soft: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
  { kind: "service", icon: Wrench, title: (d) => d.classifieds.optServiceTitle, hint: (d) => d.classifieds.optServiceHint, tone: "from-cyan-600 to-emerald-500", soft: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300" },
  { kind: "lost", icon: Search, title: (d) => d.postListing.lostOption, hint: (d) => d.postListing.lostOptionHint, tone: "from-orange-500 to-rose-500", soft: "bg-orange-500/15 text-orange-600 dark:text-orange-300", lostFound: true, idle: "border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10" },
  { kind: "found", icon: PackageSearch, title: (d) => d.postListing.foundOption, hint: (d) => d.postListing.foundOptionHint, tone: "from-sky-500 to-brand-from", soft: "bg-sky-500/15 text-sky-600 dark:text-sky-300", lostFound: true, idle: "border-sky-500/40 bg-sky-500/5 hover:bg-sky-500/10" },
];

// One category field: a number with its unit, or a row of choice chips.
function AttrInput({
  field,
  label,
  options,
  unit,
  value,
  onChange,
}: {
  field: FieldDef;
  label: string;
  options: Record<string, string>;
  unit?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "select") {
    return (
      <div className="col-span-2">
        <p className="mb-1.5 text-xs font-semibold text-muted">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(value === opt ? "" : opt)}
              aria-pressed={value === opt}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                value === opt ? "border-transparent bg-foreground text-bg" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {options[opt] ?? opt}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <span className="relative block">
        <input
          type="number"
          inputMode="numeric"
          min={field.min}
          max={field.max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} ${unit ? "pr-12" : ""}`}
        />
        {unit && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">{unit}</span>}
      </span>
    </label>
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

// A kind on the first screen: tapping it opens the form for it, so it reads
// as a link (the chevron) rather than a toggle.
function KindOption({
  onClick,
  icon,
  title,
  hint,
  soft,
  idle = "border-border bg-bg-elevated hover:bg-surface-2",
}: {
  onClick: () => void;
  icon: ReactNode;
  title: string;
  hint: string;
  soft: string;
  idle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-start overflow-hidden rounded-2xl border p-3.5 text-left transition-all hover:border-brand-via/50 active:scale-[0.98] sm:p-4 ${idle}`}
    >
      <ChevronRight className="absolute right-2.5 top-3 h-4 w-4 text-muted" />
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${soft}`}>{icon}</span>
      <span className="mt-2.5 pr-4 text-sm font-extrabold leading-tight">{title}</span>
      <span className="mt-0.5 text-[11px] leading-snug text-muted">{hint}</span>
    </button>
  );
}
