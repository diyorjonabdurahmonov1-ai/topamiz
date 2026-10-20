import { headers } from "next/headers";

// The iPhone app adds "FindoApp/iOS" to its web view's user agent
// (ios-app/capacitor.config.json), so the server can tell it's rendering
// for the app.
export async function isNativeAppRequest(): Promise<boolean> {
  return /\bFindoApp\//.test((await headers()).get("user-agent") ?? "");
}
