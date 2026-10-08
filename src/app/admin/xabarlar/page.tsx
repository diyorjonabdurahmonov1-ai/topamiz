import type { Metadata } from "next";
import { getAllConversationsForAdmin } from "@/lib/messages";
import { formatDate } from "@/lib/data";
import Avatar from "@/components/Avatar";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Xabarlar — Findo",
};

export default async function AdminMessagesPage() {
  await requireAdmin();
  const conversations = getAllConversationsForAdmin();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Xabarlar</h1>
      <p className="mt-1.5 text-sm text-muted">
        Kim kim bilan yozishayotgani va nechta xabar almashilgani — foydalanuvchilarning shaxsiy xabar matni
        bu yerda ko'rsatilmaydi.
      </p>

      <div className="mt-5 space-y-2.5">
        {conversations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            Hozircha suhbat yo'q.
          </p>
        ) : (
          conversations.map((c) => (
            <div
              key={`${c.userA.id}-${c.userB.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex shrink-0 -space-x-2">
                <Avatar
                  name={c.userA.name}
                  color={c.userA.avatarColor}
                  avatarUrl={c.userA.avatarUrl}
                  size={32}
                  className="ring-2 ring-surface"
                />
                <Avatar
                  name={c.userB.name}
                  color={c.userB.avatarColor}
                  avatarUrl={c.userB.avatarUrl}
                  size={32}
                  className="ring-2 ring-surface"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {c.userA.name} ↔ {c.userB.name}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {c.messageCount} ta xabar · oxirgisi {formatDate(c.lastMessageAt.slice(0, 10))}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
