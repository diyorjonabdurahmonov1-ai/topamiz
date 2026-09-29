"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Loader2, RotateCcw, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// A same-device, before-upload editor: the photo is drawn to a canvas, the
// uploader blacks out whatever they don't want visible (a passport number,
// an ID's MRZ lines, a card number), and only the flattened result — with
// the covered pixels genuinely gone, not just hidden under an overlay —
// ever gets sent to the server.
export default function PhotoRedactModal({
  file,
  dict,
  onDone,
  onSkip,
}: {
  file: File;
  dict: Dictionary;
  onDone: (redacted: File) => void;
  onSkip: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [drawing, setDrawing] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      setReady(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !img || !ctx) return;
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = "#000";
    for (const r of rects) ctx.fillRect(r.x, r.y, r.w, r.h);
    if (drawing) ctx.fillRect(drawing.x, drawing.y, drawing.w, drawing.h);
  }, [rects, drawing, ready]);

  function toCanvasPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    return { x: (clientX - bounds.left) * scaleX, y: (clientY - bounds.top) * scaleY };
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toCanvasPoint(e.clientX, e.clientY);
    startRef.current = p;
    setDrawing({ x: p.x, y: p.y, w: 0, h: 0 });
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    const start = startRef.current;
    if (!start) return;
    const p = toCanvasPoint(e.clientX, e.clientY);
    setDrawing({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      w: Math.abs(p.x - start.x),
      h: Math.abs(p.y - start.y),
    });
  }

  function handlePointerUp() {
    setDrawing((current) => {
      if (current && current.w > 4 && current.h > 4) {
        setRects((prev) => [...prev, current]);
      }
      return null;
    });
    startRef.current = null;
  }

  function undo() {
    setRects((prev) => prev.slice(0, -1));
  }

  function finish() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const type = file.type === "image/gif" ? "image/png" : file.type || "image/png";
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onDone(new File([blob], file.name, { type }));
      },
      type,
      0.92
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/95 p-4">
      <div className="flex items-center justify-between text-white">
        <p className="text-sm font-semibold">{dict.postListing.redactHeading}</p>
        <button
          type="button"
          onClick={onSkip}
          aria-label={dict.common.close}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-1 text-xs text-white/70">{dict.postListing.redactHint}</p>

      <div className="mt-3 flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/40">
        {!ready && <Loader2 className="h-6 w-6 animate-spin text-white" />}
        <canvas
          ref={canvasRef}
          className={`max-h-full max-w-full touch-none rounded-lg ${ready ? "" : "hidden"}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={rects.length === 0}
          className="flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" />
          {dict.postListing.redactUndo}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          {dict.postListing.redactSkip}
        </button>
        <button
          type="button"
          onClick={finish}
          disabled={!ready}
          className="btn-brand flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {dict.postListing.redactDone}
        </button>
      </div>
    </div>
  );
}
