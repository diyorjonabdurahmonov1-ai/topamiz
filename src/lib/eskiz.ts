// SMS via Eskiz (notify.eskiz.uz). The same Eskiz account can serve several
// apps: what the recipient sees as the sender is the `from` nickname sent
// with each message (ESKIZ_FROM), not the account — "4546" is Eskiz's
// default short number until a custom name like "FINDO" is approved.
//
// Eskiz only delivers message texts that match a template approved in its
// cabinet, so loginCodeMessage() below must stay word-for-word identical to
// the template registered there (see AGENTS.md).

const API_URL = "https://notify.eskiz.uz/api";

let cachedToken: string | null = null;

export function isEskizConfigured(): boolean {
  return !!(process.env.ESKIZ_EMAIL && process.env.ESKIZ_PASSWORD);
}

export function loginCodeMessage(code: string): string {
  return `Findo: tasdiqlash kodingiz ${code}. Kodni hech kimga bermang.`;
}

async function login(): Promise<string> {
  const body = new FormData();
  body.set("email", process.env.ESKIZ_EMAIL ?? "");
  body.set("password", process.env.ESKIZ_PASSWORD ?? "");
  const res = await fetch(`${API_URL}/auth/login`, { method: "POST", body });
  const data = (await res.json().catch(() => null)) as { data?: { token?: string } } | null;
  const token = data?.data?.token;
  if (!res.ok || !token) throw new Error(`Eskiz login failed (${res.status})`);
  cachedToken = token;
  return token;
}

// `phone` is 998XXXXXXXXX (digits only), as Eskiz expects.
export async function sendSms(phone: string, message: string): Promise<void> {
  const send = async (token: string) => {
    const body = new FormData();
    body.set("mobile_phone", phone);
    body.set("message", message);
    body.set("from", process.env.ESKIZ_FROM || "4546");
    return fetch(`${API_URL}/message/sms/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
  };

  let res = await send(cachedToken ?? (await login()));
  // The token lasts about a month; when it lapses, log in again once.
  if (res.status === 401) res = await send(await login());
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Eskiz send failed (${res.status}): ${detail.slice(0, 300)}`);
  }
}

export function resetEskizTokenForTests() {
  cachedToken = null;
}
