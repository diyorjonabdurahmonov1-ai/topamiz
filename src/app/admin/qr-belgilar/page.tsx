import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getAllTagsForAdmin } from "@/lib/tags";
import { formatDate } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "QR-belgilar — Findo",
};

export default async function AdminTagsPage() {
  await requireAdmin();
  const tags = getAllTagsForAdmin();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">QR-belgilar</h1>
      <p className="mt-1.5 text-sm text-muted">Jami {tags.length} ta QR-belgi, barcha foydalanuvchilardan.</p>

      <div className="mt-5 space-y-2.5">
        {tags.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            QR-belgi topilmadi.
          </p>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{tag.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {tag.ownerName} ({tag.ownerEmail}) · {tag.status === "active" ? "Faol" : "Topildi"} ·{" "}
                  {formatDate(tag.createdAt.slice(0, 10))}
                </p>
              </div>
              <Link
                href={`/t/${tag.code}`}
                target="_blank"
                aria-label="Ko'rish"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
