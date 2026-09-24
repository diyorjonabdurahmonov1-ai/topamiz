import type { Metadata } from "next";
import { Search } from "lucide-react";
import { listUsers } from "@/lib/admin-users";
import AdminUserRow from "@/components/AdminUserRow";

export const metadata: Metadata = {
  title: "Foydalanuvchilar — Topamiz",
};

export default async function AdminUsersPage(props: PageProps<"/admin/foydalanuvchilar">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const users = listUsers(q);
  const onlineCount = users.filter((u) => u.online).length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Foydalanuvchilar</h1>
      <p className="mt-1.5 text-sm text-muted">
        Jami {users.length} ta{q ? " (qidiruv natijasi)" : ""} · {onlineCount} tasi hozir onlayn.
      </p>

      <form method="GET" className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-surface px-3">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Ism yoki email bo'yicha qidirish..."
          className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
        />
      </form>

      <div className="mt-5 space-y-2.5">
        {users.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            Hech kim topilmadi.
          </p>
        ) : (
          users.map((u) => <AdminUserRow key={u.id} user={u} />)
        )}
      </div>
    </div>
  );
}
