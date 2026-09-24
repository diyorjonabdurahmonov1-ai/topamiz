import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export const metadata: Metadata = {
  title: "Kirish — Topamiz",
};

export default async function LoginPage(props: PageProps<"/kirish">) {
  const user = await getCurrentUser();
  if (user) redirect("/profil");

  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;

  return (
    <div className="mx-auto max-w-sm px-4 py-14 sm:px-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Xush <span className="gradient-text">kelibsiz</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Davom etish uchun Google hisobingiz bilan kiring.
        </p>
      </div>

      {error === "blocked" ? (
        <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-center text-sm font-medium text-danger">
          Hisobingiz bloklangan. Savollar bo&apos;lsa, qo&apos;llab-quvvatlash bilan bog&apos;laning.
        </p>
      ) : (
        error && (
          <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-center text-sm font-medium text-danger">
            Google bilan kirishda xatolik yuz berdi. Qayta urinib ko&apos;ring.
          </p>
        )
      )}

      <GoogleLoginButton />
    </div>
  );
}
