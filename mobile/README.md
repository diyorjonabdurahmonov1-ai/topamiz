# Findo phone apps (iPhone and Android)

One [Capacitor](https://capacitorjs.com) 8 project, `ios/` and `android/`,
around https://findo.net.uz (`server.url` in `capacitor.config.json`). The
apps *are* the website — same server, accounts and sessions — so site
deploys reach them with no app update. Bundle id / package:
`uz.net.findo.app` on both. What the apps add natively, and why:

- **Push notifications of the phone's own** — Apple (APNs) on iPhone,
  Firebase (FCM) on Android. Web push doesn't exist in an app's web view.
  The site detects the app (`src/lib/native-push.ts`), asks the push plugin
  for a device token and sends it to `/api/push/apns` or `/api/push/fcm`;
  `sendPushToUser` (`src/lib/push.ts`) then reaches the phone through
  `src/lib/apns.ts` / `src/lib/fcm.ts`. Tapping a notification opens its page.
- **Links open in the app.** findo.net.uz links opened elsewhere (Telegram,
  SMS) open the app — universal links on iPhone (`App/App.entitlements`,
  `/.well-known/apple-app-site-association`), App Links on Android (the
  `autoVerify` intent filter, `/.well-known/assetlinks.json`) — and the site
  goes to that page (`src/components/NativeAppBridge.tsx`).
- **The phone's own share sheet** for "share listing" (`@capacitor/share`).
- **An offline screen** (`www/offline.html`) instead of a blank page.
- **No Google sign-in.** Google refuses to sign in from an app's web view, so
  the apps (user agent `FindoApp/iOS` / `FindoApp/Android`) offer the
  phone-number account only. On iPhone this also keeps App Store rule 4.8
  ("Sign in with Apple") from applying.

Camera, photos, microphone and location work through the web view's own
file pickers and permission prompts (texts in `ios/App/App/Info.plist`;
location permissions in the Android manifest). Both apps are phone-only and
portrait.

Native code lives in `ios/` and `android/`; after changing
`capacitor.config.json` or a plugin, run:

```
cd mobile && npm install && npx cap sync
```

Keep the plugin versions in this folder's `package.json` and in the site's
own `package.json` (`@capacitor/core`, `@capacitor/app`,
`@capacitor/push-notifications`, `@capacitor/share`) the same.

## Android

Replaced the earlier Trusted Web Activity app (same package and signing key,
so it's an ordinary update on Google Play; people sign in once more, since
the app no longer shares Chrome's cookies).

**Building:** `.github/workflows/android.yml` builds an unsigned release
bundle on every change under `mobile/` and validates it; on `main` (or when
run by hand) it publishes it to the `android-build` branch as
`findo-unsigned.aab`.

**Push (Firebase):** create a Firebase project, add an Android app with
package `uz.net.findo.app`, download its `google-services.json` and put the
file's whole contents into the **`GOOGLE_SERVICES_JSON`** Actions secret
(repository → Settings → Secrets and variables → Actions). It is never
committed (`.gitignore`). For the server, Firebase console → Project
settings → Service accounts → "Generate new private key", copy the JSON to
`/var/www/topamiz/.data/firebase-service-account.json` and add to
`.env.production.local`:

```
FCM_SERVICE_ACCOUNT_FILE=/var/www/topamiz/.data/firebase-service-account.json
```

then `pm2 restart topamiz`. Without these, Android pushes are skipped and
the notification button says the push service didn't answer.

**Signing and uploading:** the upload keystore (`findo-upload.jks`, alias
`upload`) is kept by the owner and is never committed — this repository is
public. Download
`https://github.com/diyorjonabdurahmonov1-ai/topamiz/raw/android-build/findo-unsigned.aab`
next to the keystore, then:

```
cp findo-unsigned.aab findo.aab
jarsigner -keystore findo-upload.jks -sigalg SHA256withRSA -digestalg SHA-256 findo.aab upload
jarsigner -verify findo.aab
```

Upload `findo.aab` in Play Console. Each upload needs a higher
`versionCode` (and `versionName`) in `android/app/build.gradle` — but only
native changes need an upload at all. If the upload key is ever lost, Play
Console → App integrity → "Request upload key reset" replaces it.

`public/.well-known/assetlinks.json` lists the SHA-256 of both the upload key
and Google Play's app-signing key (Play Console → App integrity); App Links
need both.

`play-store-icon.png` is the 512×512 icon of the Play listing.

## iPhone

**Building — no Mac needed:** `.github/workflows/ios.yml` builds the app on
a GitHub macOS runner on every change under `mobile/`. Pushes to `main`, or
running the workflow by hand (Actions → iOS app → Run workflow), also sign
the build and upload it to App Store Connect, once these four Actions
secrets are set:

| Secret | Where to get it |
| --- | --- |
| `APPLE_TEAM_ID` | developer.apple.com → Account → Membership details → Team ID |
| `ASC_KEY_ID` | App Store Connect → Users and Access → Integrations → App Store Connect API → "+" (access: **Admin**) → the key's Key ID |
| `ASC_ISSUER_ID` | the same page, "Issuer ID" above the list |
| `ASC_KEY_P8` | the downloaded `AuthKey_XXXX.p8` file's whole contents (it can be downloaded only once) |

The build number is `100 + the workflow run number`, so each upload is
higher than the last. The version shown in the App Store (`MARKETING_VERSION`,
1.0) is in `ios/App/App.xcodeproj/project.pbxproj`; raise it only for an App
Store release with native changes.

**Push (APNs):** in `/var/www/topamiz/.env.production.local`, then restart PM2:

```
APNS_KEY_ID=XXXXXXXXXX      # developer.apple.com → Keys → "+" → tick Apple Push Notifications service
APNS_TEAM_ID=XXXXXXXXXX     # the same Team ID as above
APNS_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"   # the key's .p8 contents
```

(`APNS_KEY_FILE=/path/AuthKey_XXXX.p8` works instead of `APNS_KEY`.) The same
`APNS_TEAM_ID` also turns on the universal-links file. The app icon is
`ios/App/App/Assets.xcassets/AppIcon.appiconset` (1024×1024, no transparency).
