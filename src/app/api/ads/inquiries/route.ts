import { NextResponse } from "next/server";
import {
  createAdInquiry,
  MAX_COMPANY_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_PHONE_LENGTH,
} from "@/lib/ad-inquiries";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`ad-inquiry:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const company = typeof body?.company === "string" ? body.company.trim().slice(0, MAX_COMPANY_LENGTH) : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, MAX_PHONE_LENGTH) : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE_LENGTH) : "";

  if (!company || !phone) {
    return NextResponse.json({ error: "Kompaniya nomi va telefon raqamini kiriting" }, { status: 400 });
  }

  createAdInquiry({ company, phone, message });
  return NextResponse.json({ ok: true });
}
