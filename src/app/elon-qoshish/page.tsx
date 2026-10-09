import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, IdCard, KeyRound, PawPrint, Smartphone, Sparkles, Tag, Zap } from "lucide-react";
import { getCurrentUser, getUserPhone } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import PostListingForm from "@/components/PostListingForm";

export const metadata: Metadata = {
  title: "E'lon joylash — Findo",
};

// Accounts store phones as +998XXXXXXXXX; the form shows them the way people
// write them.
function formatPhone(phone: string | null): string {
  const m = phone?.match(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : (phone ?? "");
}

export default async function PostListingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.postListing;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-from via-brand-via to-brand-to p-6 text-white shadow-xl shadow-brand-via/25 sm:p-8">
        <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-16 right-20 h-32 w-32 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 grid-cols-2 gap-2 opacity-90 min-[400px]:grid">
          <FloatingIcon className="animate-float rotate-[-8deg]"><IdCard className="h-5 w-5" /></FloatingIcon>
          <FloatingIcon className="animate-float-slow mt-5 rotate-[10deg]"><Smartphone className="h-5 w-5" /></FloatingIcon>
          <FloatingIcon className="animate-float-slow -mt-2 rotate-[6deg]"><KeyRound className="h-5 w-5" /></FloatingIcon>
          <FloatingIcon className="animate-float mt-3 rotate-[-6deg]"><PawPrint className="h-5 w-5" /></FloatingIcon>
        </div>
        <div className="relative max-w-[68%] sm:max-w-[72%]">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">
            <Zap className="h-3 w-3" />
            {t.heroBadge}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {t.pageTitlePrefix} {t.pageTitleHighlight} {t.pageTitleSuffix}
          </h1>
          <p className="mt-1.5 text-sm text-white/85">{t.pageSubtitle}</p>
        </div>
      </div>

      <PostListingForm dict={dict} locale={locale} defaultPhone={formatPhone(getUserPhone(user.id))} />

      <h2 className="mb-3 mt-8 text-sm font-extrabold text-muted">{t.otherTypesTitle}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OtherKind
          href="/elon-qoshish/sirli-quti"
          icon={<Sparkles className="h-5 w-5" />}
          gradient="from-accent-gold to-brand-via"
          border="border-accent-gold/30 hover:border-accent-gold/60"
          title={t.mysteryBoxCalloutButton}
          body={t.mysteryBoxCalloutBody}
        />
        <OtherKind
          href="/elon-qoshish/taklif"
          icon={<Tag className="h-5 w-5" />}
          gradient="from-sky-500 to-brand-via"
          border="border-sky-500/30 hover:border-sky-500/60"
          title={t.promoCalloutButton}
          body={t.promoCalloutBody}
        />
      </div>
    </div>
  );
}

function FloatingIcon({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm ${className}`}>
      {children}
    </span>
  );
}

function OtherKind({
  href,
  icon,
  gradient,
  border,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className={`card-hover flex items-center gap-3 rounded-2xl border bg-surface p-4 ${border}`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow ${gradient}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{title}</span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{body}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}
