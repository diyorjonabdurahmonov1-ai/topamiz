# Findo Android app

A Trusted Web Activity (TWA): the app opens https://findo.net.uz full-screen
in the phone's Chrome (or, without Chrome, in its own web view — below), so it *is* the website — same server, same database,
same accounts and sessions. Nothing in this folder needs changing when the
site changes; ship site updates with `deploy.sh` as usual and the app shows
them immediately.

Generated with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
1.25.0 from `twa-manifest.json` (package `uz.net.findo.app`), with two
hand-made changes: `jcenter()` → `mavenCentral()` in `build.gradle`, and a
white-on-transparent notification icon (`res/drawable-*/ic_notification_icon.png`)
in place of the generated full-colour one, which Android would render as a
white square.

## Phones without Chrome

A Trusted Web Activity needs a browser that supports it (Chrome, and a few
others). On phones that have none — Huawei without Google services, some
Xiaomi and others whose only browser can't — the app opens the site in its
own full-screen web view instead (`FindoWebViewActivity`, chosen in
`LauncherActivity.getFallbackStrategy`), not in a browser tab with an address
bar. It handles file and photo picking, the camera, location and `tel:`
links itself, and adds `FindoApp/Android` to the user agent so the site hides
Google sign-in (Google refuses it in app web views). Web push doesn't exist
there; the site's notification button says so.

## Full-screen requires Digital Asset Links

Android only drops the browser address bar once
`https://findo.net.uz/.well-known/assetlinks.json` (`public/.well-known/` in
this repo) lists the SHA-256 fingerprint of the certificate the installed app
is signed with. Google Play re-signs uploads with its own app signing key, so
that file must hold **both**:

- the upload key's fingerprint (already there), and
- Play's app signing key fingerprint — Play Console → the app → Test and
  release → App integrity → App signing → "SHA-256 certificate fingerprint".

## Building

CI (`.github/workflows/android.yml`) builds an unsigned release bundle on
every push touching `android/`, validates it with bundletool, and publishes it
as `findo-unsigned.aab` on the `android-build` branch.

## Signing and uploading

The upload keystore (`findo-upload.jks`, alias `upload`) is kept by the owner
and is never committed — this repository is public. To sign a build:

```
git fetch origin android-build
git show origin/android-build:findo-unsigned.aab > findo-unsigned.aab
cp findo-unsigned.aab findo.aab
jarsigner -keystore findo-upload.jks -sigalg SHA256withRSA -digestalg SHA-256 findo.aab upload
jarsigner -verify findo.aab
```

Upload `findo.aab` in Play Console. Each new upload needs a higher
`appVersionCode` (bump it, and `appVersionName`, in both `twa-manifest.json`
and `app/build.gradle`) — but only Android-side changes (icon, name, colours)
need a new upload at all.

If the upload key is ever lost, Play Console → App integrity → "Request
upload key reset" replaces it; the app itself keeps working, since Play signs
it with its own key.
