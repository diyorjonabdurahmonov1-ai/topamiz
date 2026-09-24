import type { Metadata } from "next";
import { Gift, MessageCircle, QrCode, ShieldOff, Users, Wifi } from "lucide-react";
import { countBlockedUsers, countOnlineUsers, countUsers } from "@/lib/admin-users";
import { getTagStats } from "@/lib/tags";
import { countAllMessages } from "@/lib/messages";
import { getActiveAds, getAllAds } from "@/lib/ads";
import StatCard from "@/components/StatCard";

export const metadata: Metadata = {
  title: "Statistika — Topamiz",
};

export default function AdminDashboardPage() {
  const totalUsers = countUsers();
  const onlineUsers = countOnlineUsers();
  const blockedUsers = countBlockedUsers();
  const tagStats = getTagStats();
  const totalMessages = countAllMessages();
  const activeAds = getActiveAds().length;
  const allAds = getAllAds().length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Statistika</h1>
      <p className="mt-1.5 text-sm text-muted">Saytning umumiy holati bir qarashda.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Users} value={String(totalUsers)} label="Jami foydalanuvchi" />
        <StatCard icon={Wifi} value={String(onlineUsers)} label="Hozir onlayn" />
        <StatCard icon={ShieldOff} value={String(blockedUsers)} label="Bloklangan" />
        <StatCard icon={QrCode} value={`${tagStats.active} / ${tagStats.total}`} label="Faol QR-belgilar" />
        <StatCard icon={MessageCircle} value={String(totalMessages)} label="Jami xabarlar" />
        <StatCard icon={Gift} value={`${activeAds} / ${allAds}`} label="Faol reklamalar" />
      </div>
    </div>
  );
}
