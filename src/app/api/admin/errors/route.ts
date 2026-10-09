import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { deleteAllErrors, deleteErrorGroup } from "@/lib/error-log";

// { fingerprint } marks one error group as fixed; { all: true } clears the log.
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (body?.all === true) {
    deleteAllErrors();
    return NextResponse.json({ ok: true });
  }
  if (typeof body?.fingerprint === "string" && /^[0-9a-f]{16}$/.test(body.fingerprint)) {
    deleteErrorGroup(body.fingerprint);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
}
