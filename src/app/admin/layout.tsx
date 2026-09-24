import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) redirect("/");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav />
      {children}
    </div>
  );
}
