import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish — Topamiz",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/profil");

  return (
    <div className="mx-auto max-w-sm px-4 py-14 sm:px-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Topamiz'ga <span className="gradient-text">qo'shiling</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Profil oching, boshqalar bilan yozishing va buyumlaringizga QR-belgi oling.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
