import { headers } from "next/headers";

// The phone apps add "FindoApp/iOS" or "FindoApp/Android" to their web
// view's user agent (mobile/capacitor.config.json), so the server can tell
// it's rendering for one.
export async function isNativeAppRequest(): Promise<boolean> {
  return /\bFindoApp\//.test((await headers()).get("user-agent") ?? "");
}
