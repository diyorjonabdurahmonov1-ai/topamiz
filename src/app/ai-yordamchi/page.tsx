import type { Metadata } from "next";
import { MessageCircle, Search, Wand2 } from "lucide-react";
import AiAssistantChat from "@/components/AiAssistantChat";

export const metadata: Metadata = {
  title: "AI Yordamchi — Topamiz",
};

const features = [
  {
    icon: MessageCircle,
    title: "Tabiiy tilda so'rov",
    desc: "Buyumingizni oddiy so'zlar bilan tavsiflang, murakkab filtr kerak emas.",
  },
  {
    icon: Search,
    title: "Aqlli moslashtirish",
    desc: "Turkum, shahar, sana va kalit so'zlar bo'yicha eng mos e'lonlarni tanlaydi.",
  },
  {
    icon: Wand2,
    title: "Doimiy o'rganish",
    desc: "Har bir yangi e'lon bilan mosliklar bazasi kengayib boradi.",
  },
];

export default function AiAssistantPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          AI <span className="gradient-text">Yordamchi</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          Buyumingizni tavsiflang — aqlli tizim minglab e'lon orasidan eng mos
          nomzodlarni bir zumda taklif qiladi.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-brand-via">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>

        <AiAssistantChat />
      </div>
    </div>
  );
}
