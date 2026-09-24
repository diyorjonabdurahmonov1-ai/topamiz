import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import Avatar from "@/components/Avatar";

export async function generateMetadata(props: PageProps<"/profil/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const user = getUserById(Number(id));
  return { title: user ? `${user.name} — Topamiz` : "Foydalanuvchi topilmadi — Topamiz" };
}

export default async function PublicProfilePage(props: PageProps<"/profil/[id]">) {
  const { id } = await props.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) notFound();

  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.id === userId) redirect("/profil");

  const user = getUserById(userId);
  if (!user) notFound();
  const dict = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center">
        <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={88} />
        <h1 className="mt-4 text-xl font-extrabold">{user.name}</h1>
        <p className="mt-3 max-w-sm text-sm text-muted">{user.bio || dict.publicProfile.noBio}</p>

        <Link
          href={`/xabarlar/${user.id}`}
          className="btn-brand mt-6 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
        >
          <MessageCircle className="h-4 w-4" />
          {dict.publicProfile.writeMessage}
        </Link>
      </div>
    </div>
  );
}
