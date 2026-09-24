import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-brand-via">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight">
        404 — sahifa <span className="gradient-text">topilmadi</span>
      </h1>
      <p className="mt-2 text-sm text-muted">
        Qidirayotgan sahifangiz o'chirilgan yoki manzil noto'g'ri bo'lishi mumkin.
      </p>
      <Link
        href="/"
        className="btn-brand mt-6 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
      >
        <Home className="h-4 w-4" />
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
