import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import TagForm from "@/components/TagForm";

export const metadata: Metadata = {
  title: "QR-belgi yaratish — Topamiz",
};

export default async function CreateTagPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  const dict = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {dict.tags.createPageTitlePrefix}{" "}
          <span className="gradient-text">{dict.tags.createPageTitleHighlight}</span>
        </h1>
        <p className="mt-2 text-sm text-muted">{dict.tags.createPageSubtitle}</p>
      </div>

      <TagForm dict={dict} />
    </div>
  );
}
