import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import DeleteAccountButton from "@/components/DeleteAccountButton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${getDictionary(await getLocale()).deleteAccountPage.title} — Findo` };
}

// "…sign in {signIn} …write to {email}": the sentence's own word order stays
// the translator's, the links are dropped in where the placeholders sit.
function fill(template: string, parts: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{[a-zA-Z]+\})/).map((piece, i) => {
    const name = piece.match(/^\{([a-zA-Z]+)\}$/)?.[1];
    return name && name in parts ? <span key={i}>{parts[name]}</span> : piece;
  });
}

export default async function AccountDeletionPage() {
  const user = await getCurrentUser();
  const dict = getDictionary(await getLocale());
  const t = dict.deleteAccountPage;
  const bullets = [t.bullet1, t.bullet2, t.bullet3, t.bullet4, t.bullet5, t.bullet6];
  const link = "font-semibold text-brand-via hover:text-brand-to";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.title}</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">{t.intro}</p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold">{t.whatHappens}</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
          {bullets.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold">{t.howTitle}</h2>
        {user ? (
          <>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {fill(t.signedInAs, { email: <span className="font-semibold text-foreground">{user.email}</span> })}
            </p>
            <div className="mt-4">
              <DeleteAccountButton
                label={dict.profile.deleteAccount}
                confirmText={dict.profile.deleteAccountConfirm}
                errorText={dict.profile.deleteAccountError}
                className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5"
              />
            </div>
          </>
        ) : (
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {fill(t.guestHelp, {
              signIn: (
                <Link href="/kirish" className={link}>
                  {t.guestSignInLink}
                </Link>
              ),
              email: (
                <a href="mailto:info@findo.net.uz" className={link}>
                  info@findo.net.uz
                </a>
              ),
            })}
          </p>
        )}
      </div>
    </div>
  );
}
