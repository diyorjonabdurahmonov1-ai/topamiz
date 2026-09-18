import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConversations, getGuestNotifications } from "@/lib/messages";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  return NextResponse.json({
    conversations: getConversations(user.id),
    guestNotifications: getGuestNotifications(user.id),
  });
}
