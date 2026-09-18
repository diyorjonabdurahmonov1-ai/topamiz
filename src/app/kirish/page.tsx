import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Kirish — Topamiz",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/profil");

  return (
    <div className="mx-auto max-w-sm px-4 py-14 sm:px-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Xush <span className="gradient-text">kelibsiz</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted">Hisobingizga kiring.</p>
      </div>
      <LoginForm />
    </div>
  );
}
