import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { MAX_NAME_LENGTH, nameProblem } from "@/lib/user-names";

// Answers "is this profile name free?" while someone types it (sign-up, the
// profile editor). Names are public anyway, on every profile and listing, so
// this gives nothing away; the limit only stops it being hammered.
export async function GET(request: Request) {
  if (!rateLimit(`name-check:${getClientIp(request)}`, 300, 10 * 60 * 1000).allowed) {
    return NextResponse.json({ error: "Juda ko'p urinish" }, { status: 429 });
  }
  const name = (new URL(request.url).searchParams.get("name") ?? "").trim().slice(0, MAX_NAME_LENGTH);
  const user = await getCurrentUser();
  const problem = nameProblem(name, { exceptUserId: user?.id, allowReserved: !!user && isAdmin(user) });
  return NextResponse.json({ available: !problem, code: problem }, { headers: { "Cache-Control": "no-store" } });
}
