import type { Metadata } from "next";
import { BarChart3, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Tahlil — Findo",
};

export default function AdminAnalyticsPage() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const yandexId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Tashrif tahlili</h1>
      <p className="mt-1.5 text-sm text-muted">
        Kim, qayerdan kirayotgani va qaysi qadamda saytni tark etayotganini ko'rish uchun Google Analytics
        va Yandex Metrika saytga ulanadi — to'liq statistika ularning o'z sahifasida ko'rinadi.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <BarChart3 className="h-4 w-4" />
              Google Analytics
            </h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                gaId ? "bg-success/10 text-success" : "border border-border text-muted"
              }`}
            >
              {gaId ? "Ulangan" : "Ulanmagan"}
            </span>
          </div>

          {gaId ? (
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brand mt-4 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Google Analytics'ni ochish
            </a>
          ) : (
            <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-xs text-muted">
              <li>
                <a
                  href="https://analytics.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-via hover:underline"
                >
                  analytics.google.com
                </a>
                'da hisob va GA4 mulki (property) yarating.
              </li>
              <li>
                "Measurement ID"ni (masalan, <code>G-XXXXXXX</code>) nusxalang.
              </li>
              <li>
                Serverda <code>.env.production.local</code> fayliga{" "}
                <code>NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX</code> qatorini qo'shib, <code>deploy.sh</code>
                'ni qayta ishga tushiring.
              </li>
            </ol>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <BarChart3 className="h-4 w-4" />
              Yandex Metrika
            </h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                yandexId ? "bg-success/10 text-success" : "border border-border text-muted"
              }`}
            >
              {yandexId ? "Ulangan" : "Ulanmagan"}
            </span>
          </div>

          {yandexId ? (
            <a
              href="https://metrika.yandex.ru/list"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brand mt-4 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Yandex Metrika'ni ochish
            </a>
          ) : (
            <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-xs text-muted">
              <li>
                <a
                  href="https://metrika.yandex.ru/list"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-via hover:underline"
                >
                  metrika.yandex.ru
                </a>
                'da hisobingizga kirib, yangi hisoblagich (counter) yarating.
              </li>
              <li>
                Hisoblagich raqamini (masalan, <code>12345678</code>) nusxalang.
              </li>
              <li>
                Serverda <code>.env.production.local</code> fayliga{" "}
                <code>NEXT_PUBLIC_YANDEX_METRIKA_ID=12345678</code> qatorini qo'shib, <code>deploy.sh</code>
                'ni qayta ishga tushiring.
              </li>
            </ol>
          )}
        </div>
      </div>

      <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-muted">
        Ikkalasi ham bepul va bir vaqtning o'zida ishlatilishi mumkin. Ular orqali tashrif buyuruvchilar qaysi
        shahar yoki qurilmadan kirayotgani, qaysi sahifada ko'proq vaqt o'tkazayotgani va qaysi qadamda
        (masalan, elon joylash shaklini to'ldirmasdan) saytni tark etayotganini ko'rish mumkin bo'ladi.
      </p>
    </div>
  );
}
