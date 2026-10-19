import type { CategoryId, Currency, ListingKind } from "@/lib/types";
import type { VideoSource } from "@/lib/video-upload-store";

// A listing being written survives the poster moving around the site,
// switching apps, the phone reloading the page, or a pull-to-refresh — and
// is gone once the app (or tab) is closed. That is exactly sessionStorage's
// lifetime, so the text and the uploaded photos' URLs live there.
//
// A video can't: it's far too big. A finished one is just two URLs; one
// still uploading is kept as the file itself in IndexedDB, so a reload can
// start sending it again. IndexedDB outlives the tab, so the file is tagged
// with this draft's id and dropped by the first page that finds no draft
// with that id — i.e. the next time the app is opened.

const KEY = "findo-listing-draft";
const DB_NAME = "findo-drafts";
const STORE = "video";

export interface ListingDraft {
  id: string;
  kind: ListingKind;
  title: string;
  description: string;
  pickedCategory: CategoryId | null;
  price: string;
  pickedCurrency: Currency | null;
  negotiable: boolean;
  attrs: Record<string, string>;
  city: string;
  district: string;
  reward: string;
  contactPhone: string;
  imageUrls: string[];
  coords: { lat: number; lng: number } | null;
  // The upload's handle in video-upload-store (still alive after moving
  // between pages) and, once it's finished, its result (all a reload needs).
  video: { handle: string; result: { videoUrl: string; thumbnailUrl: string } | null } | null;
}

export function loadDraft(): ListingDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as ListingDraft;
    return draft && typeof draft.id === "string" && typeof draft.title === "string" ? draft : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: ListingDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Private mode or storage full: the form still works, it just won't
    // come back after a reload.
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // See saveDraft.
  }
  void deleteDraftVideo();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

interface StoredVideo {
  draftId: string;
  handle: string;
  file: File;
  source: VideoSource;
}

export async function saveDraftVideo(video: StoredVideo): Promise<void> {
  try {
    await withStore("readwrite", (store) => store.put(video, "current"));
  } catch {
    // No room on the phone for a copy: a reload mid-upload loses the video.
  }
}

export async function loadDraftVideo(draftId: string): Promise<StoredVideo | null> {
  try {
    const video = await withStore<StoredVideo | undefined>("readonly", (store) => store.get("current"));
    return video && video.draftId === draftId ? video : null;
  } catch {
    return null;
  }
}

export async function deleteDraftVideo(): Promise<void> {
  try {
    if (typeof indexedDB === "undefined") return;
    await withStore("readwrite", (store) => store.delete("current"));
  } catch {
    // Nothing stored, or IndexedDB unavailable.
  }
}
