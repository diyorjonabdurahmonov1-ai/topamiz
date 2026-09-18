import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchUsers } from "@/lib/messages";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = searchUsers(q, user.id);
  return NextResponse.json({ users: results });
}
