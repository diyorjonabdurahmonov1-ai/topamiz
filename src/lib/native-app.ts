import { headers } from "next/headers";

// The apps add "FindoApp/…" to their web view's user agent, so the server
// can tell it's rendering for one: the iPhone app always ("FindoApp/iOS",
// ios-app/capacitor.config.json), the Android app on phones without Chrome
// ("FindoApp/Android", android/…/FindoWebViewActivity.java) — with Chrome
// it's a Trusted Web Activity, i.e. Chrome itself.
export async function isNativeAppRequest(): Promise<boolean> {
  return /\bFindoApp\//.test((await headers()).get("user-agent") ?? "");
}
