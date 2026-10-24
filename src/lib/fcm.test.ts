import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import { fcmAssertion, isFcmToken, saveFcmToken, sendFcmToUser, setFcmTransportForTests } from "./fcm";
import { sendPushToUser } from "./push";

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const sa = {
  projectId: "findo-test",
  clientEmail: "push@findo-test.iam.gserviceaccount.com",
  key: privateKey,
  tokenUri: "https://oauth2.googleapis.com/token",
};
const TOKEN = "fGh7:" + "A".repeat(140);

type Call = { url: string; headers: Record<string, string>; body: string };

function fakeFcm(sendStatus = 200, sendBody: unknown = { name: "projects/findo-test/messages/1" }) {
  const calls: Call[] = [];
  setFcmTransportForTests(async (url, init) => {
    calls.push({ url, headers: init.headers, body: init.body });
    if (url === sa.tokenUri) return { status: 200, json: async () => ({ access_token: "ya29.test", expires_in: 3600 }) };
    return { status: sendStatus, json: async () => sendBody };
  }, sa);
  return calls;
}

beforeEach(() => {
  db.exec("DELETE FROM fcm_tokens; DELETE FROM apns_tokens; DELETE FROM push_subscriptions; DELETE FROM sessions; DELETE FROM users;");
});
afterEach(() => setFcmTransportForTests(null));

function user() {
  return findOrCreateGoogleUser({ googleId: "g-android", email: "android@example.com", name: "Android" });
}

describe("FCM access", () => {
  it("signs an RS256 assertion Google can verify with the service account's key", () => {
    const [header, claims, signature] = fcmAssertion(sa).split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString()).alg).toBe("RS256");
    const c = JSON.parse(Buffer.from(claims, "base64url").toString());
    expect(c.iss).toBe(sa.clientEmail);
    expect(c.scope).toBe("https://www.googleapis.com/auth/firebase.messaging");
    expect(crypto.verify("sha256", Buffer.from(`${header}.${claims}`), publicKey, Buffer.from(signature, "base64url"))).toBe(
      true
    );
  });
});

describe("sending to the Android app", () => {
  it("gets a token once, then sends a notification with the link with every sendPushToUser", async () => {
    const calls = fakeFcm();
    const u = user();
    saveFcmToken(u.id, TOKEN, "uz");

    await sendPushToUser(u.id, { title: "Aziz", body: "Salom", url: "/xabarlar/5", tag: "chat-5" });
    await sendPushToUser(u.id, { title: "Aziz", body: "Yana", url: "/xabarlar/5", tag: "chat-5" });

    const sends = calls.filter((c) => c.url.includes("messages:send"));
    expect(calls.filter((c) => c.url === sa.tokenUri)).toHaveLength(1);
    expect(sends).toHaveLength(2);
    expect(sends[0].url).toBe("https://fcm.googleapis.com/v1/projects/findo-test/messages:send");
    expect(sends[0].headers.Authorization).toBe("Bearer ya29.test");
    const msg = JSON.parse(sends[0].body).message;
    expect(msg.token).toBe(TOKEN);
    expect(msg.notification).toEqual({ title: "Aziz", body: "Salom" });
    expect(msg.data).toEqual({ url: "/xabarlar/5" });
    expect(msg.android.notification.tag).toBe("chat-5");
  });

  it("drops a token FCM says is unregistered, keeps it on other errors", async () => {
    const u = user();
    saveFcmToken(u.id, TOKEN, "uz");
    fakeFcm(400, { error: { status: "INVALID_ARGUMENT", details: [{ errorCode: "INVALID_ARGUMENT" }] } });
    await sendFcmToUser(u.id, { title: "x", body: "y" });
    expect(db.prepare("SELECT COUNT(*) c FROM fcm_tokens").get()).toEqual({ c: 1 });

    fakeFcm(404, { error: { status: "NOT_FOUND", details: [{ errorCode: "UNREGISTERED" }] } });
    await sendFcmToUser(u.id, { title: "x", body: "y" });
    expect(db.prepare("SELECT COUNT(*) c FROM fcm_tokens").get()).toEqual({ c: 0 });
  });

  it("does nothing without a service account", async () => {
    let calls = 0;
    setFcmTransportForTests(async () => {
      calls++;
      return { status: 200, json: async () => ({}) };
    }, null);
    const u = user();
    saveFcmToken(u.id, TOKEN, "uz");
    await sendFcmToUser(u.id, { title: "x", body: "y" });
    expect(calls).toBe(0);
  });

  it("only accepts token-shaped strings", () => {
    expect(isFcmToken(TOKEN)).toBe(true);
    expect(isFcmToken("short")).toBe(false);
    expect(isFcmToken("has spaces " + "a".repeat(40))).toBe(false);
  });
});
