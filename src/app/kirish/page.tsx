import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { getVisitorCountry } from "@/lib/geo";
import { getLegal } from "@/lib/legal";
import AuthPanel from "@/components/auth/AuthPanel";

export const metadata: Metadata = {
  title: "Kirish — Findo",
};

export default async function LoginPage(props: PageProps<"/kirish">) {
  const user = await getCurrentUser();
  if (user) redirect("/profil");

  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const initialTab = searchParams.tab === "register" ? "register" : "login";
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const abroad = (await getVisitorCountry()) !== "UZ";

  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-from/20 blur-3xl" />
        <div className="animate-float-slow absolute -right-24 top-64 h-80 w-80 rounded-full bg-brand-via/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-via/10 to-transparent" />
      </div>

      <div className="mx-auto max-w-md px-4 pb-16 pt-10 sm:pt-14">
        <div className="animate-fade-up mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- the site's own static icon */}
          <img src="/icon-192.png" alt="" className="mx-auto mb-4 h-16 w-16 rounded-2xl shadow-xl shadow-brand-via/30" />
          <h1 className="text-2xl font-extrabold tracking-tight">
            {dict.login.title} <span className="gradient-text">{dict.login.titleHighlight}</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted">{dict.login.subtitle}</p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-center text-sm font-medium text-danger">
            {error === "blocked" ? dict.login.blockedError : dict.login.genericError}
          </p>
        )}

        <AuthPanel dict={dict} initialTab={initialTab} legal={getLegal(locale)} abroad={abroad} />
      </div>
    </div>
  );
}
