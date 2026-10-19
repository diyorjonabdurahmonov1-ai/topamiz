import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clearSessionCookie,
  deleteUserAccount,
  getCurrentUser,
  isAdmin,
  MAX_BIO_LENGTH,
  MAX_NAME_LENGTH,
} from "@/lib/auth";
import { nameKey } from "@/lib/name-key";
import { isNameConflict, nameProblem } from "@/lib/user-names";
import { isOwnUploadUrl } from "@/lib/upload-url";
import { removeStoredFiles } from "@/lib/stored-files";

// Uploaded photos only ever come back from POST /api/upload as this prefix —
// anything else is a client claiming an arbitrary external URL is one of ours.

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (typeof body?.name === "string") {
    const name = body.name.trim().slice(0, MAX_NAME_LENGTH);
    const problem = nameProblem(name, { exceptUserId: user.id, allowReserved: isAdmin(user) });
    if (problem === "nameRequired") {
      return NextResponse.json({ error: "Ism bo'sh bo'lishi mumkin emas", code: problem }, { status: 400 });
    }
    if (problem) {
      return NextResponse.json({ error: "Bu nom band — boshqa nom toping", code: problem }, { status: 409 });
    }
    updates.push("name = ?", "name_key = ?");
    values.push(name, nameKey(name));
  }

  if (typeof body?.bio === "string") {
    updates.push("bio = ?");
    values.push(body.bio.trim().slice(0, MAX_BIO_LENGTH));
  }

  if (isOwnUploadUrl(body?.avatarUrl)) {
    updates.push("avatar_url = ?");
    values.push(body.avatarUrl);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Yangilanadigan ma'lumot topilmadi" }, { status: 400 });
  }

  try {
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values, user.id);
  } catch (err) {
    if (!isNameConflict(err)) throw err;
    return NextResponse.json({ error: "Bu nom band — boshqa nom toping", code: "nameTaken" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const files = deleteUserAccount(user.id);
  await clearSessionCookie();
  await removeStoredFiles(files);
  return NextResponse.json({ ok: true });
}
