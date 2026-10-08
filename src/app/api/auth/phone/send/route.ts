import { NextResponse } from "next/server";
import { getPhoneAccount } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isEskizConfigured, loginCodeMessage, sendSms } from "@/lib/eskiz";
import { RESEND_COOLDOWN_SECONDS, discardCode, issueCode, normalizeUzPhone } from "@/lib/phone-login";
import { authError } from "@/lib/phone-auth-responses";

// Sends a verification code for signing up or for resetting a forgotten
// password. Every SMS costs money, so sends are capped per IP and per number
// on top of the one-minute resend cooldown.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const purpose = body?.purpose === "reset" ? "reset" : "register";
  const phone = normalizeUzPhone(typeof body?.phone === "string" ? body.phone : "");
  if (!phone) return authError("invalidPhone", 400);

  // Told up front, so nobody waits for an SMS for an account that already
  // exists (or, when resetting, doesn't).
  const account = getPhoneAccount(phone);
  if (purpose === "register" && account) return authError("exists", 409);
  if (purpose === "reset" && !account) return authError("notFound", 404);

  const byIp = rateLimit(`phone-send-ip:${getClientIp(request)}`, 10, 60 * 60 * 1000);
  const byPhone = rateLimit(`phone-send:${phone}`, 5, 60 * 60 * 1000);
  if (!byIp.allowed || !byPhone.allowed) return authError("tooMany", 429);

  const configured = isEskizConfigured();
  if (!configured && process.env.NODE_ENV === "production") return authError("smsNotConfigured", 503);

  const issued = issueCode(purpose, phone);
  if ("retryAfterSeconds" in issued) {
    return authError("recentlySent", 429, { resendIn: issued.retryAfterSeconds });
  }

  if (!configured) {
    // Local development only — lets the flow be exercised without spending SMS.
    console.info(`[phone-login] ${purpose} code for ${phone}: ${issued.code}`);
  } else {
    try {
      await sendSms(phone.slice(1), loginCodeMessage(issued.code));
    } catch (err) {
      console.error("[phone-login] SMS send failed:", err);
      discardCode(purpose, phone);
      return authError("smsFailed", 502);
    }
  }

  return NextResponse.json({ ok: true, phone, resendIn: RESEND_COOLDOWN_SECONDS });
}
