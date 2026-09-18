import Link from "next/link";
import {
  Camera,
  Wand2,
  MessageCircle,
  Megaphone,
  Bot,
  ArrowUpRight,
  Gift,
} from "lucide-react";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import SectionHeading from "@/components/SectionHeading";
import ListingCard from "@/components/ListingCard";
import AdCard from "@/components/AdCard";
import { ads, getRewardedListings, listings } from "@/lib/data";

const steps = [
  {
    icon: Camera,
    title: "E'lon joylang",
    desc: "Yo'qolgan yoki topilgan buyum haqida rasm va tavsif bilan bir necha soniyada e'lon joylang.",
  },
  {
    icon: Wand2,
    title: "AI mos e'lonlarni topadi",
    desc: "Bizning aqlli tizim tavsif, turkum va joylashuv bo'yicha o'xshash e'lonlarni avtomatik taklif qiladi.",
  },
  {
    icon: MessageCircle,
    title: "Bog'lanib, qaytarib olasiz",
    desc: "Topuvchi bilan xavfsiz aloqa o'rnatib, buyumingizni qaytarib olasiz yoki mukofot berasiz.",
  },
];

export default function Home() {
  const latest = [...listings]
    .filter((l) => l.status === "active")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);
  const rewarded = getRewardedListings().slice(0, 3);

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Turkumlar"
          title="Nimani yo'qotdingiz yoki topdingiz?"
          description="Tezroq topish uchun to'g'ri turkumni tanlang."
        />
        <div className="mt-8">
          <CategoryGrid />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Yangi e'lonlar"
          title="So'nggi joylangan e'lonlar"
          description="Eng so'nggi yo'qolgan va topilgan buyumlar."
          href="/elonlar"
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="relative mx-auto mt-8 max-w-7xl overflow-hidden rounded-3xl px-4 py-14 sm:px-8">
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            backgroundImage:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent-gold) 12%, transparent), color-mix(in srgb, var(--accent-gold-2) 6%, transparent))",
          }}
        />
        <div className="absolute inset-0 rounded-3xl border border-accent-gold/20" />
        <div className="relative">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-accent-gold">
                <Gift className="h-3.5 w-3.5" />
                Mukofotli e'lonlar
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Buyumni qaytarib bering, mukofot oling
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                Ba'zi egalar o'z buyumini topib berganlarga mukofot taklif
                qilishadi. Balki siz ham shundaylardan biri bo'lasiz.
              </p>
            </div>
            <Link
              href="/mukofotli"
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accent-gold hover:text-accent-gold-2"
            >
              Barcha mukofotlar
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {rewarded.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Qanday ishlaydi"
          title="3 qadamda buyumingizni qaytarib oling"
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="card-hover relative rounded-2xl border border-border bg-surface p-6"
            >
              <span className="absolute right-5 top-5 text-4xl font-extrabold text-surface-2">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl btn-brand text-white">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 rounded-3xl border border-border bg-surface p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl btn-brand text-white">
              <Bot className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              AI Yordamchi buyumingizni topishga yordam beradi
            </h2>
            <p className="mt-2.5 text-sm text-muted">
              Tavsifni kiriting — aqlli tizim mos kategoriya, shahar va kalit
              so'zlar bo'yicha barcha e'lonlar orasidan eng mos nomzodlarni
              tanlab beradi.
            </p>
            <Link
              href="/ai-yordamchi"
              className="btn-brand mt-5 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            >
              AI Yordamchini sinab ko'ring
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-bg-elevated p-5">
            <p className="text-xs font-semibold text-muted">AI YORDAMCHI</p>
            <div className="mt-3 space-y-2">
              <div className="w-fit rounded-xl rounded-tl-sm bg-surface-2 px-4 py-2.5 text-sm">
                "Qora rangli hamyon, ichida hujjatlar bor edi"
              </div>
              <div className="w-fit rounded-xl rounded-tr-sm btn-brand px-4 py-2.5 text-sm text-white ml-auto">
                3 ta mos e'lon topildi — eng yuqori moslik 82%
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Reklama taxtachasi"
          title="Sponsorlar va e'lonlar"
          href="/reklama"
          linkLabel="Reklama joylashtirish"
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl px-8 py-14 text-center btn-brand">
          <Megaphone className="mx-auto h-9 w-9 text-white/90" />
          <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
            Buyum yo'qotdingizmi yoki topdingizmi?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/85">
            Hoziroq bepul e'lon joylang — minglab foydalanuvchi va AI
            yordamchi sizga yordam beradi.
          </p>
          <Link
            href="/elon-qoshish"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-via shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Bepul e'lon joylash
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
