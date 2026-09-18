import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QrCode } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTagByCode } from "@/lib/tags";
import Logo from "@/components/Logo";
import TagContactForm from "@/components/TagContactForm";

export async function generateMetadata(props: PageProps<"/t/[code]">): Promise<Metadata> {
  const { code } = await props.params;
  const tag = getTagByCode(code);
  return { title: tag ? `${tag.title} — Topamiz` : "Belgi topilmadi — Topamiz" };
}

export default async function PublicTagPage(props: PageProps<"/t/[code]">) {
  const { code } = await props.params;
  const tag = getTagByCode(code);
  if (!tag) notFound();

  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <div className="mb-6 flex justify-center">
        <Logo />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <span className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-brand-via/10 px-3 py-1 text-xs font-semibold text-brand-via">
          <QrCode className="h-3.5 w-3.5" />
          QR-belgi orqali topilgan buyum
        </span>
        <h1 className="mt-3 text-xl font-extrabold">{tag.title}</h1>
      </div>

      {tag.photoUrls.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {tag.photoUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded to server at runtime, not a build-time asset
            <img
              key={url}
              src={url}
              alt={tag.title}
              className="aspect-square w-full rounded-xl border border-border object-cover"
            />
          ))}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tasnifi</p>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">{tag.description}</p>
      </div>

      <div className="mt-4">
        <TagContactForm code={tag.code} isLoggedIn={!!user} />
      </div>
    </div>
  );
}
