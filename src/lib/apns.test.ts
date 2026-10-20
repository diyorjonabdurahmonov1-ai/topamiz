import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import { apnsBody, apnsJwt, isApnsToken, saveApnsToken, sendApnsToUser, setApnsTransportForTests } from "./apns";
import { sendPushToUser } from "./push";

const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const cfg = { keyId: "ABC123DEFG", teamId: "TEAM123456", key: privateKey, topic: "uz.net.findo.app" };
const TOKEN = "a".repeat(64);

type Sent = { env: string; token: string; headers: Record<string, string>; body: string };

beforeEach(() => {
  db.exec("DELETE FROM apns_tokens; DELETE FROM push_subscriptions; DELETE FROM sessions; DELETE FROM users;");
});
afterEach(() => setApnsTransportForTests(null));

function user() {
  return findOrCreateGoogleUser({ googleId: "g-ios", email: "ios@example.com", name: "iPhone" });
}

describe("APNs provider token", () => {
  it("is an ES256 JWT Apple can verify with the key", () => {
    setApnsTransportForTests(null, cfg);
    const [header, claims, signature] = apnsJwt(cfg).split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({ alg: "ES256", kid: "ABC123DEFG" });
    expect(JSON.parse(Buffer.from(claims, "base64url").toString()).iss).toBe("TEAM123456");
    const ok = crypto.verify(
      "sha256",
      Buffer.from(`${header}.${claims}`),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(signature, "base64url")
    );
    expect(ok).toBe(true);
  });
});

describe("sending to the iPhone app", () => {
  it("sends an alert with the link, and goes out with every sendPushToUser", async () => {
    const sent: Sent[] = [];
    setApnsTransportForTests(async (env, token, headers, body) => {
      sent.push({ env, token, headers, body });
      return { status: 200 };
    }, cfg);
    const u = user();
    saveApnsToken(u.id, TOKEN, "uz");

    await sendPushToUser(u.id, { title: "Aziz", body: "Salom", url: "/xabarlar/5", tag: "chat-5" });

    expect(sent).toHaveLength(1);
    expect(sent[0].env).toBe("production");
    expect(sent[0].headers["apns-topic"]).toBe("uz.net.findo.app");
    expect(sent[0].headers["apns-collapse-id"]).toBe("chat-5");
    expect(JSON.parse(sent[0].body)).toEqual(
      JSON.parse(apnsBody({ title: "Aziz", body: "Salom", url: "/xabarlar/5", tag: "chat-5" }))
    );
  });

  it("drops a token Apple says is gone", async () => {
    setApnsTransportForTests(async () => ({ status: 410, reason: "Unregistered" }), cfg);
    const u = user();
    saveApnsToken(u.id, TOKEN, "uz");
    await sendApnsToUser(u.id, { title: "x", body: "y" });
    expect(db.prepare("SELECT COUNT(*) c FROM apns_tokens").get()).toEqual({ c: 0 });
  });

  it("moves a development-build token to the sandbox service", async () => {
    const envs: string[] = [];
    setApnsTransportForTests(async (env) => {
      envs.push(env);
      return env === "production" ? { status: 400, reason: "BadDeviceToken" } : { status: 200 };
    }, cfg);
    const u = user();
    saveApnsToken(u.id, TOKEN, "uz");
    await sendApnsToUser(u.id, { title: "x", body: "y" });
    expect(envs).toEqual(["production", "sandbox"]);
    expect(db.prepare("SELECT env FROM apns_tokens").get()).toEqual({ env: "sandbox" });
  });

  it("does nothing without a configured key", async () => {
    let calls = 0;
    setApnsTransportForTests(async () => {
      calls++;
      return { status: 200 };
    }, null);
    const u = user();
    saveApnsToken(u.id, TOKEN, "uz");
    await sendApnsToUser(u.id, { title: "x", body: "y" });
    expect(calls).toBe(0);
  });

  it("only accepts hex device tokens", () => {
    expect(isApnsToken(TOKEN)).toBe(true);
    expect(isApnsToken("not a token")).toBe(false);
    expect(isApnsToken("ab")).toBe(false);
  });
});
