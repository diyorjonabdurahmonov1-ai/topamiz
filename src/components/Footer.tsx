import Link from "next/link";
import { Globe, Send, Phone } from "lucide-react";
import Logo from "./Logo";
import { categories } from "@/lib/data";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatCopyright } from "@/lib/i18n/format";

export default function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <footer className="border-t border-border bg-bg-elevated">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{dict.footer.tagline}</p>
            <div className="mt-5 flex gap-2">
              <a
                href="#"
                aria-label="Telegram"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-foreground hover:border-brand-via/50"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Ijtimoiy tarmoq"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-foreground hover:border-brand-via/50"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="tel:+998712001122"
                aria-label="Qo'llab-quvvatlash"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-foreground hover:border-brand-via/50"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">{dict.footer.sectionsHeading}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><Link href="/elonlar?kind=lost" className="hover:text-foreground">{dict.footer.lostItems}</Link></li>
              <li><Link href="/elonlar?kind=found" className="hover:text-foreground">{dict.footer.foundItems}</Link></li>
              <li><Link href="/mukofotli" className="hover:text-foreground">{dict.footer.rewardedListings}</Link></li>
              <li><Link href="/reklama" className="hover:text-foreground">{dict.footer.adBoard}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">{dict.footer.categoriesHeading}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {categories.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link href={`/elonlar?category=${c.id}`} className="hover:text-foreground">
                    {dict.categories[c.id]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">{dict.footer.helpHeading}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><Link href="/elon-qoshish" className="hover:text-foreground">{dict.footer.howToPost}</Link></li>
              <li><a href="#" className="hover:text-foreground">{dict.footer.safetyRules}</a></li>
              <li><a href="#" className="hover:text-foreground">{dict.footer.termsOfUse}</a></li>
              <li><a href="mailto:info@findo.net.uz" className="hover:text-foreground">info@findo.net.uz</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row">
          <p>{formatCopyright(locale, new Date().getFullYear())}</p>
          <p>{dict.footer.madeIn}</p>
        </div>
      </div>
    </footer>
  );
}
