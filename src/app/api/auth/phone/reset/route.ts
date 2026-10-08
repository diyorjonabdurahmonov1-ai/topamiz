import { NextResponse } from "next/server";
import { getPhoneAccount, setUserPassword } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { checkCode, normalizeUzPhone, passwordProblem } from "@/lib/phone-login";
import { isCodeShaped } from "@/lib/verification-code";
import { CODE_ERRORS, signIn, tooManyAttempts } from "@/lib/phone-auth-responses";

// "Forgot password": the SMS code proves the number is yours, then the new
// password is set and you're signed in.
export async function POST(request: Request) {
  if (!rateLimit(`phone-reset-ip:${getClientIp(request)}`, 30, 60 * 60 * 1000).allowed) {
    return tooManyAttempts();
  }

  const body = await request.json().catch(() => null);
  const phone = normalizeUzPhone(typeof body?.phone === "string" ? body.phone : "");
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!phone || !isCodeShaped(code)) {
    return NextResponse.json({ error: CODE_ERRORS.wrong }, { status: 400 });
  }
  const badPassword = passwordProblem(body?.password);
  if (badPassword) return NextResponse.json({ error: badPassword }, { status: 400 });

  const account = getPhoneAccount(phone);
  if (!account) return NextResponse.json({ error: "not-found", code: "not-found" }, { status: 404 });
  const result = checkCode("reset", phone, code);
  if (result !== "ok") return NextResponse.json({ error: CODE_ERRORS[result] }, { status: 400 });

  setUserPassword(account.user.id, body.password);
  return signIn(account.user);
}
