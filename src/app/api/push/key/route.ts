import { NextResponse } from "next/server";
import { getVapidKeys } from "@/lib/push";

// The public half of the VAPID key pair, which the browser needs to
// subscribe. Served at runtime rather than baked into the client bundle so
// a server-generated pair (see getVapidKeys) works without a rebuild.
export async function GET() {
  return NextResponse.json({ key: getVapidKeys().publicKey });
}
