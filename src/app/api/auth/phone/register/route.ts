import { MAX_NAME_LENGTH, createPhoneUser, getPhoneAccount, isReservedName } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { checkCode, normalizeUzPhone, passwordProblem } from "@/lib/phone-login";
import { isCodeShaped } from "@/lib/verification-code";
import { CODE_RESULT_ERRORS, authError, signIn } from "@/lib/phone-auth-responses";

export async function POST(request: Request) {
  if (!rateLimit(`phone-register-ip:${getClientIp(request)}`, 30, 60 * 60 * 1000).allowed) {
    return authError("tooMany", 429);
  }

  const body = await request.json().catch(() => null);
  const phone = normalizeUzPhone(typeof body?.phone === "string" ? body.phone : "");
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  if (!phone) return authError("invalidPhone", 400);
  if (!isCodeShaped(code)) return authError("codeWrong", 400);
  if (body?.acceptTerms !== true) return authError("consentRequired", 400);
  if (name.length < 2) return authError("nameRequired", 400);
  if (isReservedName(name)) return authError("nameReserved", 400);
  const badPassword = passwordProblem(body?.password);
  if (badPassword) return authError(badPassword, 400);

  if (getPhoneAccount(phone)) return authError("exists", 409);
  const result = checkCode("register", phone, code);
  if (result !== "ok") return authError(CODE_RESULT_ERRORS[result], 400);

  return signIn(createPhoneUser({ phone, name, password: body.password }));
}
