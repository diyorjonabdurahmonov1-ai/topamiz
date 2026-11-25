"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

// Full-screen photo viewer: pinch or double-tap to zoom, drag to look around
// a zoomed picture, swipe sideways for the next photo, swipe down to close.
// Mouse: wheel to zoom, double-click to zoom (a quick second click counts as a double tap), arrow keys for the next photo.
// It is a same-page overlay on purpose — a target="_blank" link would throw
// an installed app or PWA out into the system browser.

const MAX_SCALE = 6;
const DOUBLE_TAP_SCALE = 2.5;

type View = { s: number; x: number; y: number };
type Pt = { x: number; y: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export default function PhotoViewer({
  urls,
  index,
  onIndex,
  onClose,
  dict,
  alt = "",
}: {
  urls: string[];
  index: number;
  onIndex?: (i: number) => void;
  onClose: () => void;
  dict: Dictionary;
  alt?: string;
}) {
  const count = urls.length;
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 });
  const [gesturing, setGesturing] = useState(false);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const pointers = useRef(new Map<number, Pt>());
  const start = useRef<{ view: View; mid: Pt; dist: number; at: Pt; time: number; moved: boolean; pinched: boolean }>({
    view,
    mid: { x: 0, y: 0 },
    dist: 0,
    at: { x: 0, y: 0 },
    time: 0,
    moved: false,
    pinched: false,
  });
  const lastTap = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  const go = useCallback(
    (delta: number) => {
      if (count < 2 || !onIndex) return;
      onIndex((index + delta + count) % count);
    },
    [count, index, onIndex]
  );

  // A new photo starts unzoomed.
  const [shownIndex, setShownIndex] = useState(index);
  if (shownIndex !== index) {
    setShownIndex(index);
    setView({ s: 1, x: 0, y: 0 });
  }

  // Keep a zoomed picture's edge from leaving the screen.
  const bound = useCallback((v: View): View => {
    const el = box.current;
    if (!el || v.s <= 1) return { s: Math.max(1, v.s), x: 0, y: 0 };
    const maxX = ((v.s - 1) * el.clientWidth) / 2;
    const maxY = ((v.s - 1) * el.clientHeight) / 2;
    return { s: v.s, x: clamp(v.x, -maxX, maxX), y: clamp(v.y, -maxY, maxY) };
  }, []);

  // Zoom to `s`, keeping the point under (px, py) — relative to the screen
  // centre — where it is.
  const zoomAt = useCallback(
    (from: View, s: number, px: number, py: number): View => {
      const ns = clamp(s, 1, MAX_SCALE);
      const k = ns / from.s;
      return bound({ s: ns, x: px - (px - from.x) * k, y: py - (py - from.y) * k });
    },
    [bound]
  );

  const rel = (p: Pt): Pt => {
    const r = box.current!.getBoundingClientRect();
    return { x: p.x - r.left - r.width / 2, y: p.y - r.top - r.height / 2 };
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "+" || e.key === "=") setView((v) => zoomAt(v, v.s * 1.4, 0, 0));
      if (e.key === "-") setView((v) => zoomAt(v, v.s / 1.4, 0, 0));
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, go, zoomAt]);

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setGesturing(true);
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      start.current = { view: viewRef.current, mid: pts[0], dist: 0, at: pts[0], time: Date.now(), moved: false, pinched: false };
    } else if (pts.length === 2) {
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      start.current = {
        ...start.current,
        view: viewRef.current,
        mid,
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
        pinched: true,
        moved: true,
      };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const st = start.current;
    if (pts.length >= 2) {
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ns = clamp(st.view.s * (dist / st.dist), 1, MAX_SCALE);
      const m0 = rel(st.mid);
      const m1 = rel(mid);
      const k = ns / st.view.s;
      setView(bound({ s: ns, x: m1.x - (m0.x - st.view.x) * k, y: m1.y - (m0.y - st.view.y) * k }));
      return;
    }
    const dx = e.clientX - st.at.x;
    const dy = e.clientY - st.at.y;
    if (Math.hypot(dx, dy) > 8) st.moved = true;
    if (st.view.s > 1) {
      setView(bound({ s: st.view.s, x: st.view.x + dx, y: st.view.y + dy }));
    } else if (!st.pinched) {
      // Unzoomed: the picture follows a downward drag (swipe to close).
      setView({ s: 1, x: 0, y: Math.max(0, dy) * 0.6 });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const tracked = pointers.current.get(e.pointerId);
    if (!tracked) return;
    // Where the finger lifted; some synthetic/odd events report 0,0 there.
    const last = e.clientX === 0 && e.clientY === 0 ? tracked : { x: e.clientX, y: e.clientY };
    pointers.current.delete(e.pointerId);
    const st = start.current;
    if (pointers.current.size > 0) {
      // Lifted one finger of a pinch: carry on panning with the other.
      const rest = [...pointers.current.values()][0];
      start.current = { ...st, view: viewRef.current, at: rest, mid: rest, dist: 0 };
      return;
    }
    setGesturing(false);
    const dx = last.x - st.at.x;
    const dy = last.y - st.at.y;
    const v = viewRef.current;

    if (st.pinched) {
      if (v.s < 1.05) setView({ s: 1, x: 0, y: 0 });
      return;
    }
    if (!st.moved) {
      // A tap. Two quick ones zoom in / back out around the finger.
      const now = Date.now();
      const lt = lastTap.current;
      if (now - lt.time < 320 && Math.hypot(last.x - lt.x, last.y - lt.y) < 40) {
        lastTap.current = { time: 0, x: 0, y: 0 };
        const p = rel({ x: last.x, y: last.y });
        setView(v.s > 1.05 ? { s: 1, x: 0, y: 0 } : zoomAt(v, DOUBLE_TAP_SCALE, p.x, p.y));
      } else {
        lastTap.current = { time: now, x: last.x, y: last.y };
      }
      return;
    }
    if (st.view.s <= 1) {
      if (dy > 110 && dy > Math.abs(dx)) {
        onClose();
        return;
      }
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        go(dx < 0 ? 1 : -1);
        return;
      }
      setView({ s: 1, x: 0, y: 0 });
    }
  }

  function onWheel(e: React.WheelEvent) {
    const p = rel({ x: e.clientX, y: e.clientY });
    setView((v) => zoomAt(v, v.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), p.x, p.y));
  }

  const zoomed = view.s > 1.01;

  return (
    <div
      ref={box}
      role="dialog"
      aria-modal="true"
      className="animate-fade-up fixed inset-0 z-[100] touch-none select-none overflow-hidden bg-black"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset */}
      <img
        src={urls[index]}
        alt={alt}
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
          transition: gesturing ? "none" : "transform 160ms ease-out",
          opacity: !zoomed && view.y > 0 ? Math.max(0.35, 1 - view.y / 400) : 1,
        }}
      />

      <button
        type="button"
        onClick={onClose}
        aria-label={dict.common.close}
        className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
      >
        <X className="h-5 w-5" />
      </button>

      {count > 1 && !zoomed && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={dict.common.previous}
            className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:flex sm:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={dict.common.next}
            className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:flex sm:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="pointer-events-none absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
            {index + 1} / {count}
          </span>
        </>
      )}
    </div>
  );
}
