# Findo iPhone app

A [Capacitor](https://capacitorjs.com) 8 shell around https://findo.net.uz
(`server.url` in `capacitor.config.json`): like the Android app, it *is* the
website, with the same server, accounts and sessions, so site deploys reach
it with no app update. What it adds natively, and why:

- **Push notifications through Apple (APNs).** Web push doesn't exist in an
  app's web view. The site detects the app (`src/lib/native-push.ts`), asks
  the push plugin for a device token and sends it to `/api/push/apns`;
  `sendPushToUser` (`src/lib/push.ts`) then reaches the phone through
  `src/lib/apns.ts`. Tapping a notification opens its page.
- **Universal links.** findo.net.uz links opened elsewhere open in the app
  (`applinks:` in `App/App.entitlements`, served by
  `/.well-known/apple-app-site-association`).
- **An offline screen** (`www/offline.html`) instead of a blank page.
- **No Google sign-in.** Google refuses to sign in from an app's web view, so
  the app (user agent `FindoApp/iOS`) offers the phone-number account only.
  This also means App Store rule 4.8 ("Sign in with Apple") doesn't apply.

Camera, photo library, microphone and location prompts use the texts in
`App/Info.plist`. The app is iPhone-only and portrait-only.

## Building: no Mac needed

`.github/workflows/ios.yml` builds the app on a GitHub macOS runner on every
push that touches `ios-app/`. Pushes to `main`, or running the workflow by
hand (Actions → iOS app → Run workflow), also sign the build and upload it to
App Store Connect, once these four **Actions secrets** are set (repository →
Settings → Secrets and variables → Actions):

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

## Server: push notifications

In `/var/www/topamiz/.env.production.local`, then restart PM2:

```
APNS_KEY_ID=XXXXXXXXXX      # developer.apple.com → Keys → "+" → tick Apple Push Notifications service
APNS_TEAM_ID=XXXXXXXXXX     # the same Team ID as above
APNS_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"   # the key's .p8 contents
```

(`APNS_KEY_FILE=/path/AuthKey_XXXX.p8` works instead of `APNS_KEY`.) The same
`APNS_TEAM_ID` also turns on the universal-links file. Without these, iPhone
pushes are skipped silently and nothing else changes.

## Changing the native project

```
cd ios-app && npm install && npx cap sync ios
```

After a Capacitor or plugin upgrade, keep the versions in this folder's
`package.json` and in the site's own `package.json` (`@capacitor/core`,
`@capacitor/push-notifications`) the same. The app icon is
`ios/App/App/Assets.xcassets/AppIcon.appiconset` (1024×1024, no transparency).
