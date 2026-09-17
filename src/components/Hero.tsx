import { CheckCircle2, ShieldCheck, Users } from "lucide-react";
import HeroSearch from "./HeroSearch";
import StatCard from "./StatCard";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg to-bg" />
      <div className="animate-float pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full blob bg-brand-from/40" />
      <div className="animate-float-slow pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full blob bg-brand-to/30" />
      <div className="animate-float pointer-events-none absolute left-1/3 top-64 h-64 w-64 rounded-full blob bg-brand-via/25" />

      <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <div className="animate-fade-up mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-muted">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accent-gold" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-gold" />
          </span>
          AI yordamida buyumlarni bir-biriga moslashtiramiz
        </div>

        <h1 className="animate-fade-up text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Yo'qotdingizmi? <span className="gradient-text">Topamiz</span>
          <br />
          egasini toping, xotirjam bo'ling.
        </h1>

        <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-base text-muted sm:text-lg">
          O'zbekiston bo'ylab yo'qolgan va topilgan buyumlar uchun yagona
          platforma. E'lon joylang, AI yordamchi mos e'lonlarni toping, kerak
          bo'lsa mukofot taklif qiling.
        </p>

        <div className="animate-fade-up mt-8">
          <HeroSearch />
        </div>

        <div className="animate-fade-up mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={CheckCircle2} value="3 240+" label="Topilgan buyumlar" />
          <StatCard icon={Users} value="18 500+" label="Faol foydalanuvchilar" />
          <StatCard icon={ShieldCheck} value="24/7" label="Xavfsiz muloqot" />
        </div>
      </div>
    </section>
  );
}
