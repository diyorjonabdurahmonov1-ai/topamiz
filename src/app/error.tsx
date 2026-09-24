"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <TriangleAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Nimadir xato ketdi</h1>
      <p className="mt-2 text-sm text-muted">
        Kechirasiz, sahifani yuklashda kutilmagan xatolik yuz berdi. Qayta urinib
        ko'ring — agar davom etsa, birozdan so'ng qaytib tashrif buyuring.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-brand flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
        >
          <RotateCw className="h-4 w-4" />
          Qayta urinish
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-2"
        >
          <Home className="h-4 w-4" />
          Bosh sahifa
        </Link>
      </div>
    </div>
  );
}
