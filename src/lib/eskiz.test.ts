import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { codeMessage, resetEskizTokenForTests, sendSms } from "./eskiz";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  resetEskizTokenForTests();
  vi.stubEnv("ESKIZ_EMAIL", "owner@example.com");
  vi.stubEnv("ESKIZ_PASSWORD", "secret");
  vi.stubEnv("ESKIZ_FROM", "4546");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendSms", () => {
  it("logs in once and reuses the token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(200, { data: { token: "tok1" } }))
      .mockResolvedValue(json(200, { status: "waiting" }));
    vi.stubGlobal("fetch", fetchMock);

    await sendSms("998901234567", codeMessage("register", "1234"));
    await sendSms("998901234567", codeMessage("reset", "4321"));

    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.filter((u) => u.endsWith("/auth/login"))).toHaveLength(1);
    const [, init] = fetchMock.mock.calls[1];
    expect(init.headers.Authorization).toBe("Bearer tok1");
    const form = init.body as FormData;
    expect(form.get("mobile_phone")).toBe("998901234567");
    expect(form.get("from")).toBe("4546");
    expect(form.get("message")).toBe("Findo.net.uz saytida ro'yxatdan o'tish uchun tasdiqlash kodi: 1234. Kodni hech kimga bermang!");
    const resetForm = fetchMock.mock.calls[2][1].body as FormData;
    expect(resetForm.get("message")).toBe(
      "Findo.net.uz saytida parolni tiklash uchun tasdiqlash kodi: 4321. Agar buni siz so'ramagan bo'lsangiz, e'tibor bermang."
    );
  });

  it("logs in again when the token has expired", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(200, { data: { token: "old" } }))
      .mockResolvedValueOnce(json(401, { message: "Expired" }))
      .mockResolvedValueOnce(json(200, { data: { token: "new" } }))
      .mockResolvedValueOnce(json(200, { status: "waiting" }));
    vi.stubGlobal("fetch", fetchMock);

    await sendSms("998901234567", "x");
    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe("Bearer new");
  });

  it("throws when Eskiz rejects the message", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(json(200, { data: { token: "tok" } }))
        .mockResolvedValueOnce(json(400, { message: "Template not approved" }))
    );
    await expect(sendSms("998901234567", "x")).rejects.toThrow(/Template not approved/);
  });
});
