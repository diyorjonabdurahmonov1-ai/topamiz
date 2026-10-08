import { getPhoneAccount, verifyPassword } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { normalizeUzPhone } from "@/lib/phone-login";
import { authError, signIn } from "@/lib/phone-auth-responses";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = normalizeUzPhone(typeof body?.phone === "string" ? body.phone : "");
  const password = typeof body?.password === "string" ? body.password : "";
  if (!phone) return authError("invalidPhone", 400);
  if (!password) return authError("loginWrong", 400);

  // Caps password guessing, both against one number and from one place.
  const byIp = rateLimit(`phone-login-ip:${getClientIp(request)}`, 30, 15 * 60 * 1000);
  const byPhone = rateLimit(`phone-login:${phone}`, 10, 15 * 60 * 1000);
  if (!byIp.allowed || !byPhone.allowed) return authError("tooMany", 429);

  const account = getPhoneAccount(phone);
  if (!account) return authError("notFound", 404);
  if (!account.passwordHash) return authError("noPassword", 409);
  if (!verifyPassword(password, account.passwordHash)) return authError("loginWrong", 401);
  return signIn(account.user);
}
