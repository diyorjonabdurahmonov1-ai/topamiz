import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isEskizConfigured, loginCodeMessage, sendSms } from "@/lib/eskiz";
import { RESEND_COOLDOWN_SECONDS, discardLoginCode, issueLoginCode, normalizeUzPhone } from "@/lib/phone-login";

// Every SMS costs money, so sends are capped per IP and per number on top of
// the one-minute resend cooldown.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = normalizeUzPhone(typeof body?.phone === "string" ? body.phone : "");
  if (!phone) {
    return NextResponse.json({ error: "Telefon raqam noto'g'ri. Masalan: 90 123 45 67" }, { status: 400 });
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

  const issued = issueLoginCode(phone);
  if ("retryAfterSeconds" in issued) {
    return NextResponse.json(
      { error: "Kod yaqinda yuborildi. Biroz kuting.", resendIn: issued.retryAfterSeconds },
      { status: 429 }
    );
  }

  if (!configured) {
    // Local development only — lets the flow be exercised without spending SMS.
    console.info(`[phone-login] code for ${phone}: ${issued.code}`);
  } else {
    try {
      await sendSms(phone.slice(1), loginCodeMessage(issued.code));
    } catch (err) {
      console.error("[phone-login] SMS send failed:", err);
      discardLoginCode(phone);
      return NextResponse.json(
        { error: "SMS yuborilmadi. Birozdan so'ng qayta urinib ko'ring." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ ok: true, phone, resendIn: RESEND_COOLDOWN_SECONDS });
}
