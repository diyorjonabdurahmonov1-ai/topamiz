import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati — Findo",
};

const SECTIONS = [
  {
    title: "1. Qaysi ma'lumotlarni to'playmiz",
    body: "Google orqali kirganingizda hisobingizdan ism, email va profil rasmi olinadi. E'lon yoki QR-belgi yaratganda siz o'zingiz kiritgan sarlavha, tavsif, rasm, lokatsiya, telefon raqami va mukofot summasi saqlanadi. Boshqa foydalanuvchilar bilan yozishgan xabarlaringiz va yuborgan rasmlaringiz ham saytda saqlanadi.",
  },
  {
    title: "2. Qurilma va tashrif ma'lumotlari",
    body: "Agar sayt egasi yoqqan bo'lsa, Google Analytics va/yoki Yandex Metrika orqali qaysi shahar/qurilmadan kirayotganingiz, qaysi sahifalarni ko'rayotganingiz kabi anonim, yig'ma statistika yig'ilishi mumkin. Push-bildirishnomalarga obuna bo'lsangiz, brauzeringizning bildirishnoma manzili (push endpoint) saqlanadi — faqat sizga xabar yuborish uchun ishlatiladi.",
  },
  {
    title: "3. Ma'lumotlardan qanday foydalanamiz",
    body: "Ma'lumotlaringiz faqat xizmatni ishga tushirish uchun ishlatiladi: e'loningizni boshqa foydalanuvchilarga ko'rsatish, xabarlashish imkonini berish, topilma/yo'qotma bo'yicha bildirishnoma yuborish. Ma'lumotlaringiz uchinchi shaxslarga sotilmaydi va reklama maqsadida boshqa kompaniyalarga uzatilmaydi.",
  },
  {
    title: "4. Uchinchi tomon xizmatlari",
    body: "Kirish uchun Google hisobidan (Google Sign-In) foydalanamiz. Xarita ko'rsatish uchun OpenStreetMap/CARTO xarita plitkalaridan foydalaniladi — bu so'rovlar brauzeringizdan to'g'ridan-to'g'ri xarita xizmatiga ketadi. Sayt egasi yoqqan bo'lsa, Google Analytics va Yandex Metrika anonim tashrif statistikasi uchun ishlatiladi. Har bir xizmat o'zining maxfiylik siyosatiga ega.",
  },
  {
    title: "5. Ma'lumotlarni saqlash muddati",
    body: "Profilingiz, e'lonlaringiz va xabarlaringiz hisobingiz faol ekanligi davomida saqlanadi. Alohida e'lonni istalgan vaqtda o'z profilingizdan o'chirishingiz mumkin.",
  },
  {
    title: "6. Hisobni va ma'lumotlarni o'chirish",
    body: "Hisobingizni istalgan vaqtda butunlay o'chirishingiz mumkin — bu amal profilingiz, xabarlaringiz va QR-belgilaringizni qaytarib bo'lmas tarzda o'chiradi (e'lonlaringiz saytda qoladi, lekin egasiz bo'lib qoladi). Buni \"Mening profilim\" sahifasidan yoki quyidagi havola orqali amalga oshirishingiz mumkin.",
    link: { href: "/hisobni-ochirish", label: "Hisobni o'chirish sahifasi" },
  },
  {
    title: "7. Bolalar maxfiyligi",
    body: "Findo 13 yoshdan kichik bolalar uchun mo'ljallanmagan va ulardan ongli ravishda ma'lumot to'plamaydi.",
  },
  {
    title: "8. Ushbu siyosatning o'zgarishi",
    body: "Ushbu maxfiylik siyosati vaqti-vaqti bilan yangilanishi mumkin. Muhim o'zgarishlar shu sahifada e'lon qilinadi.",
  },
  {
    title: "9. Aloqa",
    body: "Ma'lumotlaringiz yuzasidan savol yoki so'rovlaringiz bo'lsa, info@findo.net.uz manziliga yozing.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-via/10 text-brand-via">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Maxfiylik siyosati</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Findo qanday ma'lumot to'playotgani, ulardan qanday foydalanayotgani va ularni qanday o'chirish
        mumkinligi haqida.
      </p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => (
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
