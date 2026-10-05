import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import DeleteAccountButton from "@/components/DeleteAccountButton";

export const metadata: Metadata = {
  title: "Hisobni va ma'lumotlarni o'chirish — Findo",
};

const DELETE_CONFIRM =
  "Hisobingizni butunlay o'chirmoqchimisiz? Profilingiz, xabarlaringiz va QR-belgilaringiz qaytarib bo'lmas tarzda o'chiriladi. E'lonlaringiz saytda qoladi, lekin egasiz bo'lib qoladi.";
const DELETE_ERROR = "Hisobni o'chirishda xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring.";

export default async function AccountDeletionPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Hisobni va ma'lumotlarni o'chirish
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Findo'dagi hisobingizni va unga bog'liq barcha shaxsiy ma'lumotlaringizni istalgan vaqtda
        butunlay o'chirishingiz mumkin. Ilovani telefoningizda o'rnatgan yoki o'rnatmagan bo'lishingizdan
        qat'i nazar, bu sahifa orqali so'rov yuborishingiz mumkin.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold">O'chirilganda nima bo'ladi</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
          <li>Profilingiz (ism, bio, rasm) butunlay o'chiriladi.</li>
          <li>Barcha xabar yozishmalaringiz va QR-belgilaringiz o'chiriladi.</li>
          <li>Do'stlar ro'yxati va push-bildirishnoma obunalari bekor qilinadi.</li>
          <li>
            Joylashtirgan e'lonlaringiz saytda qoladi (boshqalarning ular bo'yicha yozishmalari buzilmasligi
            uchun), lekin ularning egasi ko'rsatilmay qoladi.
          </li>
          <li>Bu amalni ortga qaytarib bo'lmaydi.</li>
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold">So'rov qanday yuboriladi</h2>
        {user ? (
          <>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Siz <span className="font-semibold text-foreground">{user.email}</span> sifatida
              kirgansiz. Hisobingizni hoziroq o'chirishingiz mumkin:
            </p>
            <div className="mt-4">
              <DeleteAccountButton
                label="Hisobni butunlay o'chirish"
                confirmText={DELETE_CONFIRM}
                errorText={DELETE_ERROR}
                className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5"
              />
            </div>
          </>
        ) : (
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Hisobingizni o'chirish uchun avval{" "}
            <Link href="/kirish" className="font-semibold text-brand-via hover:text-brand-to">
              tizimga kiring
            </Link>{" "}
            va shu sahifaga qayting — "Hisobni butunlay o'chirish" tugmasi paydo bo'ladi. Hisobingizga
            kira olmasangiz, qaysi email bilan ro'yxatdan o'tganingizni ko'rsatib{" "}
            <a href="mailto:info@findo.net.uz" className="font-semibold text-brand-via hover:text-brand-to">
              info@findo.net.uz
            </a>{" "}
            manziliga yozing — hisobingizni qo'lda o'chirib beramiz.
          </p>
        )}
      </div>
    </div>
  );
}
