import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Foydalanish shartlari — Findo",
};

const SECTIONS = [
  {
    title: "1. Platforma haqida",
    body: "Findo (findo.net.uz) — yo'qolgan va topilgan buyumlar haqida e'lon joylash, izlash va egasi bilan bog'lanish imkonini beruvchi platforma. Xizmatdan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz.",
  },
  {
    title: "2. Ro'yxatdan o'tish",
    body: "E'lon joylash, QR-belgi yaratish yoki boshqa foydalanuvchilarga xabar yozish uchun Google hisobingiz orqali kirishingiz kerak. Hisobingiz orqali amalga oshirilgan barcha harakatlar uchun siz javobgarsiz.",
  },
  {
    title: "3. E'lon va xabarlar mazmuni",
    body: "Joylashtirilgan e'lon, rasm va xabarlar to'g'ri va haqiqiy bo'lishi kerak. Soxta e'lon berish, boshqa odamning buyumini o'ziniki qilib ko'rsatish, firibgarlik maqsadida mukofot va'da qilish qat'iyan taqiqlanadi.",
  },
  {
    title: "4. Taqiqlangan harakatlar",
    body: "Qonunga zid, haqoratli, zo'ravonlikka chaqiruvchi, boshqa foydalanuvchilarni aldash yoki bezovta qilish maqsadidagi har qanday e'lon yoki xabar taqiqlanadi. Bunday holatlar aniqlansa, e'lon o'chiriladi, hisob bloklanishi mumkin.",
  },
  {
    title: "5. Shikoyat va moderatsiya",
    body: "Har bir e'lonni foydalanuvchilar shikoyat qilishi mumkin. Bir nechta mustaqil shikoyat kelib tushgan e'lon avtomatik ko'rib chiqiladi va, qoidabuzarlik tasdiqlansa, olib tashlanadi. Findo ma'muriyati zarur hollarda e'lon yoki hisobni oldindan ogohlantirmasdan o'chirish huquqini saqlab qoladi.",
  },
  {
    title: "6. Foydalanuvchilar orasidagi uchrashuvlar",
    body: "Findo faqat foydalanuvchilarni bir-biri bilan bog'lash vositasi bo'lib, ular orasidagi uchrashuv, mukofot to'lovi yoki buyum topshirish jarayoniga aralashmaydi va bu jarayonda yuzaga kelishi mumkin bo'lgan har qanday zarar uchun javobgar emas. Uchrashuv xavfsizligi bo'yicha tavsiyalar \"Xavfsizlik qoidalari\" sahifasida keltirilgan.",
  },
  {
    title: "7. Shaxsiy ma'lumotlar",
    body: "Ro'yxatdan o'tishda Google hisobingizdan ism va email olinadi. E'lon joylashda siz o'zingiz kiritgan ism, telefon raqami va rasmlar boshqa foydalanuvchilarga ko'rinadi — shuning uchun faqat kerakli ma'lumotni kiriting. Ma'lumotlaringiz uchinchi shaxslarga sotilmaydi yoki reklama maqsadida uzatilmaydi.",
  },
  {
    title: "8. Xizmatning o'zgarishi",
    body: "Findo funksiyalari va ushbu shartlar vaqt o'tishi bilan yangilanishi mumkin. Muhim o'zgarishlar bo'lsa, ular shu sahifada e'lon qilinadi.",
  },
  {
    title: "9. Aloqa",
    body: "Savol yoki takliflaringiz bo'lsa, info@findo.net.uz manziliga yozing.",
  },
];

export default function TermsOfUsePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-via/10 text-brand-via">
        <FileText className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Foydalanish shartlari</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Findo platformasidan foydalanishdan oldin quyidagi shartlar bilan tanishib chiqing.
      </p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-sm font-bold">{section.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
