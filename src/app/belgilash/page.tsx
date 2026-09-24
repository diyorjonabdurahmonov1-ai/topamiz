import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import TagForm from "@/components/TagForm";

export const metadata: Metadata = {
  title: "QR-belgi yaratish — Topamiz",
};

export default async function CreateTagPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Buyumingizga <span className="gradient-text">QR-belgi</span> oling
        </h1>
        <p className="mt-2 text-sm text-muted">
          Buyumingizni yo'qotishdan oldin unga QR-belgi yarating, chop eting va
          yopishtirib qo'ying. Kimdir topib olib skaner qilsa, sizga to'g'ridan-to'g'ri
          xabar yoza oladi.
        </p>
      </div>

      <TagForm />
    </div>
  );
}
