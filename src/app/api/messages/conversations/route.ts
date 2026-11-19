import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser } from "@/lib/auth";
import { getConversations, getGuestNotifications } from "@/lib/messages";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  return NextResponse.json({
    conversations: getConversations(user.id),
    guestNotifications: getGuestNotifications(user.id),
  });
}
