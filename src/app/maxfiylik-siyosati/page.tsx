import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { getLegal } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${getLegal(await getLocale()).privacy.title} — Findo` };
}

export default async function PrivacyPolicyPage() {
  const doc = getLegal(await getLocale()).privacy;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-via/10 text-brand-via">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{doc.title}</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">{doc.intro}</p>

      <div className="mt-8 space-y-6">
        {doc.sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-sm font-bold">{section.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{section.body}</p>
            {section.link && (
              <Link
                href={section.link.href}
                className="mt-2 inline-block text-sm font-semibold text-brand-via hover:text-brand-to"
              >
                {section.link.label} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
