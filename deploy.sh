#!/usr/bin/env bash
# Topamiz deploy script — run this ON THE SERVER, from the app directory:
#
#   cd /var/www/topamiz && bash deploy.sh
#
# What it does: pull main, install deps, build, restart PM2.
# What it guarantees: if anything fails (git, npm, or the build itself),
# the script stops immediately and the currently-running PM2 process is
# left completely untouched — including restoring the previous .next
# build output, so the live site keeps serving the old version rather
# than a half-written build. There is no window where the running server
# can end up reading a partially-rebuilt .next directory.
set -euo pipefail

APP_DIR="/var/www/topamiz"
PM2_NAME="topamiz"
BRANCH="main"

cd "$APP_DIR"

BEFORE_SHA="$(git rev-parse --short HEAD)"
echo "==> Joriy versiya: $BEFORE_SHA"

restore_on_failure() {
  echo ""
  echo "!! Deploy muvaffaqiyatsiz bo'ldi (oxirgi bosqich: $CURRENT_STEP)."
  if [ -d .next.bak ]; then
    echo "!! Eski build tiklanmoqda..."
    rm -rf .next
    mv .next.bak .next
  fi
  echo "!! PM2 process ($PM2_NAME) qayta ishga tushirilmadi — eski versiya ($BEFORE_SHA) davom etmoqda."
  echo "!! Xatolikni tuzatib, qayta urinib ko'ring: bash deploy.sh"
  exit 1
}
trap restore_on_failure ERR

CURRENT_STEP="kodni tortish (git pull)"
echo "==> 1/5 $CURRENT_STEP"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

CURRENT_STEP="bog'liqliklarni o'rnatish (npm ci)"
echo "==> 2/5 $CURRENT_STEP"
npm ci

CURRENT_STEP="eski build'ni zaxiralash"
echo "==> 3/5 $CURRENT_STEP"
rm -rf .next.bak
if [ -d .next ]; then
  mv .next .next.bak
fi

CURRENT_STEP="build (npm run build)"
echo "==> 4/5 $CURRENT_STEP"
npm run build

# Build succeeded — the old build is no longer needed.
rm -rf .next.bak

CURRENT_STEP="PM2'da qayta ishga tushirish"
echo "==> 5/5 $CURRENT_STEP"
pm2 restart "$PM2_NAME" --update-env

trap - ERR
AFTER_SHA="$(git rev-parse --short HEAD)"
echo ""
echo "==> Deploy muvaffaqiyatli yakunlandi: $BEFORE_SHA -> $AFTER_SHA"
