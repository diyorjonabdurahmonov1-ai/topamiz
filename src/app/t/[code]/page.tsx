import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, QrCode } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTagByCode } from "@/lib/tags";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import Logo from "@/components/Logo";
import TagContactForm from "@/components/TagContactForm";
import TagPhoto from "@/components/TagPhoto";

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
  const dict = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <div className="mb-6 flex justify-center">
        <Logo />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <span className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-brand-via/10 px-3 py-1 text-xs font-semibold text-brand-via">
          <QrCode className="h-3.5 w-3.5" />
          {dict.tags.publicBadge}
        </span>
        <h1 className="mt-3 text-xl font-extrabold">{tag.title}</h1>
        {tag.status === "resolved" && (
          <span className="mx-auto mt-2 flex w-fit items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {dict.tags.resolvedBadge}
          </span>
        )}
      </div>

      {tag.photoUrls.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {tag.photoUrls.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square w-full overflow-hidden rounded-xl border border-border"
            >
              <TagPhoto src={url} alt={tag.title} priority={index === 0} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {dict.tags.descriptionLabel}
        </p>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">{tag.description}</p>
      </div>

      <div className="mt-4">
        {tag.status === "resolved" ? (
          <div className="rounded-2xl border border-border bg-surface p-5 text-center text-sm text-muted">
            {dict.tags.resolvedNotice}
          </div>
        ) : (
          <TagContactForm code={tag.code} isLoggedIn={!!user} dict={dict} />
        )}
      </div>
    </div>
  );
}
