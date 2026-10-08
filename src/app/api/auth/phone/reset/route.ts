import { getPhoneAccount, setUserPassword } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { checkCode, normalizeUzPhone, passwordProblem } from "@/lib/phone-login";
import { isCodeShaped } from "@/lib/verification-code";
import { CODE_RESULT_ERRORS, authError, signIn } from "@/lib/phone-auth-responses";

// "Forgot password": the SMS code proves the number is yours, then the new
// password is set and you're signed in.
export async function POST(request: Request) {
  if (!rateLimit(`phone-reset-ip:${getClientIp(request)}`, 30, 60 * 60 * 1000).allowed) {
    return authError("tooMany", 429);
  }

  const body = await request.json().catch(() => null);
  const phone = normalizeUzPhone(typeof body?.phone === "string" ? body.phone : "");
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!phone) return authError("invalidPhone", 400);
  if (!isCodeShaped(code)) return authError("codeWrong", 400);
  const badPassword = passwordProblem(body?.password);
  if (badPassword) return authError(badPassword, 400);

  const account = getPhoneAccount(phone);
  if (!account) return authError("notFound", 404);
  const result = checkCode("reset", phone, code);
  if (result !== "ok") return authError(CODE_RESULT_ERRORS[result], 400);

  setUserPassword(account.user.id, body.password);
  return signIn(account.user);
}
