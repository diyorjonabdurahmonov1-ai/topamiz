import Link from "next/link";
import { MapPinCheck } from "lucide-react";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2 font-extrabold text-xl tracking-tight ${className}`}
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl btn-brand text-white shadow-lg">
        <MapPinCheck className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="gradient-text">Topamiz</span>
    </Link>
  );
}
