import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { SAFETY_ICONS, getLegal } from "@/lib/legal";

const CONTACT_EMAIL = "info@findo.net.uz";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${getLegal(await getLocale()).safety.title} — Findo` };
}

export default async function SafetyRulesPage() {
  const doc = getLegal(await getLocale()).safety;
  const [beforeEmail, afterEmail] = doc.fraudBody.split("{email}");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-via/10 text-brand-via">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{doc.title}</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">{doc.intro}</p>

      <div className="mt-8 space-y-4">
        {doc.rules.map((rule, i) => {
          const Icon = SAFETY_ICONS[i];
          return (
            <div key={rule.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-via/10 text-brand-via">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold">{rule.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{rule.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-danger/25 bg-danger/5 p-5 text-sm text-muted">
        <p className="font-bold text-danger">{doc.fraudTitle}</p>
        <p className="mt-1.5 leading-relaxed">
          {beforeEmail}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-via hover:underline">
            {CONTACT_EMAIL}
          </a>
          {afterEmail}
        </p>
      </div>
    </div>
  );
}
