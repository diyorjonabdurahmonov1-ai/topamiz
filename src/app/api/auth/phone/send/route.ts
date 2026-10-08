import { NextResponse } from "next/server";
import { getPhoneAccount } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isEskizConfigured, loginCodeMessage, sendSms } from "@/lib/eskiz";
import { RESEND_COOLDOWN_SECONDS, discardCode, issueCode, normalizeUzPhone } from "@/lib/phone-login";

// Sends a verification code for signing up or for resetting a forgotten
// password. Every SMS costs money, so sends are capped per IP and per number
// on top of the one-minute resend cooldown.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const purpose = body?.purpose === "reset" ? "reset" : "register";
  const phone = normalizeUzPhone(typeof body?.phone === "string" ? body.phone : "");
  if (!phone) {
    return NextResponse.json({ error: "Telefon raqam noto'g'ri. Masalan: 90 123 45 67" }, { status: 400 });
  }

  // Told up front, so nobody waits for an SMS for an account that already
  // exists (or, when resetting, doesn't).
  const account = getPhoneAccount(phone);
  if (purpose === "register" && account) {
    return NextResponse.json({ error: "exists", code: "exists" }, { status: 409 });
  }
  if (purpose === "reset" && !account) {
    return NextResponse.json({ error: "not-found", code: "not-found" }, { status: 404 });
  }

  const byIp = rateLimit(`phone-send-ip:${getClientIp(request)}`, 10, 60 * 60 * 1000);
  const byPhone = rateLimit(`phone-send:${phone}`, 5, 60 * 60 * 1000);
  if (!byIp.allowed || !byPhone.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429 }
    );
  }

  const configured = isEskizConfigured();
  if (!configured && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "SMS xizmati hozircha sozlanmagan." }, { status: 503 });
  }

  const issued = issueCode(purpose, phone);
  if ("retryAfterSeconds" in issued) {
    return NextResponse.json(
      { error: "Kod yaqinda yuborildi. Biroz kuting.", resendIn: issued.retryAfterSeconds },
      { status: 429 }
    );
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
      return NextResponse.json(
        { error: "SMS yuborilmadi. Birozdan so'ng qayta urinib ko'ring." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ ok: true, phone, resendIn: RESEND_COOLDOWN_SECONDS });
}
