import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser } from "@/lib/auth";
import { searchUsers } from "@/lib/messages";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = searchUsers(q, user.id);
  return NextResponse.json({ users: results });
}
