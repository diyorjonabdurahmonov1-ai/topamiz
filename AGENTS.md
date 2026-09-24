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
  `request_body max_size 20MB`.
- `ufw`: port 3000 is only open to `172.18.0.0/16` (the Docker network) —
  it is not reachable from the public internet directly, only through Caddy.
- Auth cookies are `secure: true` in production (see `src/lib/auth.ts`), so
  the site only works over HTTPS. Don't test login against the server over
  plain `http://`.
- Sign-in is Google-only (`src/lib/google-auth.ts`, `/api/auth/google*`) —
  requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in a gitignored
  `.env.production.local` at `/var/www/topamiz/`. Get these from a Google
  Cloud Console OAuth client (Web application type); its one authorized
  redirect URI must be exactly `https://findo.net.uz/api/auth/google/callback`.
  Without these two vars set, `/kirish` renders fine but clicking through
  fails.

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
