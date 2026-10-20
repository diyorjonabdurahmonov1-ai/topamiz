import { NextResponse } from "next/server";

// Served at /.well-known/apple-app-site-association (next.config.ts): tells
// iOS that findo.net.uz links opened elsewhere — Telegram, SMS, Safari — may
// open in the Findo app (ios-app/, its associated-domains entitlement).
// Needs APPLE_TEAM_ID (the developer account's Team ID; APNS_TEAM_ID is used
// if it isn't set — it's the same team) in .env.production.local.
export async function GET() {
  const team = (process.env.APPLE_TEAM_ID || process.env.APNS_TEAM_ID || "").trim();
  if (!/^[A-Z0-9]{10}$/.test(team)) return new NextResponse(null, { status: 404 });
  const appID = `${team}.${process.env.APNS_TOPIC?.trim() || "uz.net.findo.app"}`;
  return NextResponse.json(
    {
      applinks: {
        details: [
          {
            appIDs: [appID],
            // Every page, except the API and the Google sign-in round-trip
            // (which must finish in the browser that started it).
            components: [
              { "/": "/api/*", exclude: true },
              { "/": "/*" },
            ],
          },
        ],
      },
      webcredentials: { apps: [appID] },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
