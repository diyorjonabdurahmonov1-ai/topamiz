import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, QrCode } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTagsByOwner } from "@/lib/tags";
import { generateQrDataUrl, getBaseUrlFromHeaders, tagUrl } from "@/lib/qr";
import TagCard from "@/components/TagCard";

export const metadata: Metadata = {
  title: "Mening QR-belgilarim — Topamiz",
};

export default async function MyTagsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");

  const tags = getTagsByOwner(user.id);
  const baseUrl = await getBaseUrlFromHeaders();
  const withQr = await Promise.all(
    tags.map(async (tag) => ({
      tag,
      qrDataUrl: await generateQrDataUrl(tagUrl(baseUrl, tag.code)),
    }))
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Mening QR-belgilarim</h1>
        <Link
          href="/belgilash"
          className="btn-brand flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Yangi
        </Link>
      </div>

      {withQr.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <QrCode className="h-8 w-8 text-muted" />
          <p className="mt-3 text-sm font-semibold">Hali QR-belgi yo'q</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Buyumingiz yo'qolishidan oldin unga QR-belgi yarating.
          </p>
          <Link
            href="/belgilash"
            className="btn-brand mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            QR-belgi yaratish
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {withQr.map(({ tag, qrDataUrl }) => (
            <TagCard key={tag.id} tag={tag} qrDataUrl={qrDataUrl} />
          ))}
        </div>
      )}
    </div>
  );
}
