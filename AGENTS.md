<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Deployment

Topamiz runs on the owner's own VPS — not Vercel, not any serverless
platform. That choice is load-bearing: the app persists to a local SQLite
file and a local uploads directory, neither of which survive a serverless
cold start or an ephemeral filesystem.

### Server

- Hostkey VPS, Ubuntu 24.04, IP `148.135.209.79`, domain `https://findo.net.uz`
  (DNS managed at ahost.uz).
- App lives at `/var/www/topamiz`, run by PM2 as process `topamiz`,
  listening on port `3000` (`next start`).
- Data: SQLite at `/var/www/topamiz/.data/topamiz.db`; uploaded photos at
  `/var/www/topamiz/.uploads/`. Both are gitignored — they are server state,
  never part of a deploy.
- HTTPS/reverse proxy: **not** the Nginx setup from this repo's earlier
  history — the server runs Docker Caddy instead (container
  `backend-caddy-1`, config at `/opt/prostaff/backend/Caddyfile`). The
  Topamiz block is appended at the end of that file:
  `findo.net.uz -> reverse_proxy 172.18.0.1:3000` with
  `request_body max_size 20MB`. Caddy rejects any request body over this
  limit before it ever reaches the app, which is why video uploads are
  chunked (see the video upload note below) — leave it as is.
- `ufw`: port 3000 is only open to `172.18.0.0/16` (the Docker network) —
  it is not reachable from the public internet directly, only through Caddy.
- Auth cookies are `secure: true` in production (see `src/lib/auth.ts`), so
  the site only works over HTTPS. Don't test login against the server over
  plain `http://`.
- Google sign-in (`src/lib/google-auth.ts`, `/api/auth/google*`) —
  requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in a gitignored
  `.env.production.local` at `/var/www/topamiz/`. Get these from a Google
  Cloud Console OAuth client (Web application type); its one authorized
  redirect URI must be exactly `https://findo.net.uz/api/auth/google/callback`.
  Without these two vars set, `/kirish` renders fine but clicking through
  fails.
- Phone-number accounts (`/kirish`, `src/components/auth/`, `/api/auth/phone/*`):
  sign up with name + phone + password (scrypt-hashed) + an SMS code and an
  explicit consent tick (recorded in `users.terms_accepted_at`); sign in with
  phone + password; "forgot password" resets it with an SMS code. Codes go
  out through Eskiz (`src/lib/eskiz.ts`) (my.eskiz.uz — the same account the
  owner uses for another app). Needs `ESKIZ_EMAIL` and `ESKIZ_PASSWORD` (the
  Eskiz cabinet login) and optionally `ESKIZ_FROM` (sender nickname,
  defaults to Eskiz's `4546`; set to e.g. `FINDO` once that nickname is
  approved under "Nik uchun ariza") in `.env.production.local` — `bash setup-eskiz.sh` on the server asks for
  them, checks them against Eskiz, writes them there and restarts PM2. Eskiz only
  delivers texts matching an approved template ("Mening matnlarim"), so the
  texts in `codeMessage()` must stay word-for-word identical to the two
  templates approved there — Eskiz's "Punkt 2" rejects any code text that
  doesn't name the site and what the code is for (4-digit code — `src/lib/verification-code.ts`):
  sign-up `Findo.net.uz saytida ro'yxatdan o'tish uchun tasdiqlash kodi: 1234. Kodni hech kimga bermang!` and
  password reset `Findo.net.uz saytida parolni tiklash uchun tasdiqlash kodi: 1234. Agar buni siz so'ramagan bo'lsangiz, e'tibor bermang.`
  Without the two vars, the phone form shows "SMS xizmati hozircha
  sozlanmagan" and Google sign-in keeps working.
- The home-page ad banner (`/admin/reklama`, `src/lib/ads.ts`) is managed by
  whoever's Google account email is listed in `ADMIN_EMAILS` (comma-separated
  if more than one), also in `.env.production.local`. Anyone else hitting
  `/admin/reklama` is redirected to `/`.
- Visitor analytics (`src/components/Analytics.tsx`, admin's `/admin/tahlil`)
  are optional — site works fine with neither set. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  (a GA4 Measurement ID from analytics.google.com) and/or
  `NEXT_PUBLIC_YANDEX_METRIKA_ID` (a counter number from metrika.yandex.ru) to
  `.env.production.local` to turn either one on; both can run at once.
- Notifications: an in-site feed at `/bildirishnomalar` (`src/lib/notifications.ts`
  — friend added, a friend's new listing, comments and likes on your
  listings) plus web push for those and for messages (`src/lib/push.ts`,
  `public/sw.js`). Push needs no configuration: unless
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` are set, the server
  generates a VAPID key pair on first use and keeps it in `.data/vapid.json`
  (server state, covered by `backup.sh` — deleting it silently orphans every
  existing subscription until each browser re-subscribes on its next visit).
  `src/components/NotificationCenter.tsx` asks signed-in users to turn push
  on, and while the site is open chimes and shows a toast for anything new
  (via the service worker, or by polling `/api/notifications/count`).
- Listing videos (`/api/upload-video`, `src/lib/r2.ts`) are stored on
  Cloudflare R2, not the VPS's own disk — R2 has zero egress fees, and the
  120GB SSD this server ships with has no room for accumulating video.
  Requires `ffmpeg` on the server (`apt install ffmpeg`; the route shells out
  to both `ffmpeg` and `ffprobe` to validate, compress, and thumbnail each
  upload before it ever reaches R2) and these five vars in
  `.env.production.local`: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — all from the
  R2 bucket's own dashboard (Cloudflare dashboard → R2 Object Storage →
  the bucket → Settings, and Manage API Tokens). Without `ffmpeg` installed
  or these vars set, video upload fails with a clear error but the rest of
  the site is unaffected.
  Uploads are chunked (`src/lib/video-uploads.ts`): the browser sends the
  file in 2MB pieces (three in parallel, each retried on failure) so no request comes near Caddy's 20MB body limit, then
  polls while the server compresses it in the background. Before uploading,
  the phone itself usually compresses the video (`src/lib/video-compress.ts`,
  WebCodecs via `mediabunny`), and the server then only remuxes it with
  `ffmpeg -c copy`; anything else is re-encoded as before. Uploads run in a
  site-wide store (`src/lib/video-upload-store.ts`), so a listing can be
  published while its video is still uploading — the server attaches the
  video to the listing when it's ready. Upload sessions
  live in memory in the single PM2 process, so a restart mid-upload just
  makes the poster pick the video again. When an upload fails on a phone,
  the browser reports the details (error code, file type/size, user agent)
  to the server log: `pm2 logs topamiz --lines 200 --nostream | grep video-upload-failure`.

### Android app

`android/` is a Trusted Web Activity (package `uz.net.findo.app`) — the
Play Store app is this website opened full-screen in the phone's Chrome, so
it shares the server, database, accounts and sessions with the site, and
site deploys reach it with no app update. CI (`.github/workflows/android.yml`)
builds an unsigned bundle to the `android-build` branch; the owner signs it
offline with the upload keystore, which is never committed (the repo is
public). `public/.well-known/assetlinks.json` must list both the upload key's
and Google Play's app-signing key's SHA-256, or the app shows a browser
address bar. Details in `android/README.md`.

### Another project shares this server — do not touch it

`prostaff` (containers `backend-api-1`, `backend-db-1`, `backend-caddy-1`)
runs on the same box and shares the same Caddy instance. Never edit its
blocks in the Caddyfile, its containers, or its database. The Caddyfile is
bind-mounted into the container, so `sed -i` on it is not safe to script
blindly: back it up first, edit only the Topamiz block, then
`caddy validate` before `caddy reload` — never restart or recreate the
`backend-caddy-1` container to pick up a config change.

### Deploying an update

```
git push origin main   # from a dev machine, after tests pass locally
```

Then, on the server:

```
cd /var/www/topamiz && bash deploy.sh
```

`deploy.sh` (repo root) pulls `main`, installs deps, builds, and restarts
PM2 — and if the build fails, it restores the previous `.next` and leaves
PM2 untouched, so the currently-running version keeps serving. See the
script itself for the exact mechanics.

### Backups

`backup.sh` (repo root) snapshots `.data/` and `.uploads/` to
`/var/backups/topamiz/`. It's meant to run daily via cron on the server —
see the script's header comment for the crontab line. Nothing here runs
automatically from a dev machine or from this repo's CI (there is none);
it only exists once someone adds the cron entry on the server itself.
