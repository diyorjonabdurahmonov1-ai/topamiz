#!/usr/bin/env bash
# Eskiz SMS sozlash — run this ON THE SERVER, from the app directory:
#
#   cd /var/www/topamiz && bash setup-eskiz.sh
#
# Asks for the Eskiz login — the email and the "Yashirin kalit" shown on
# my.eskiz.uz → SMS shlyuz — checks it against Eskiz itself, then writes
# ESKIZ_EMAIL / ESKIZ_PASSWORD / ESKIZ_FROM into .env.production.local
# (replacing any earlier ESKIZ_ lines) and restarts PM2 to pick them up.
# The key is never echoed, passed on a command line, or kept in shell history.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/topamiz}"
PM2_NAME="topamiz"
ENV_FILE="$APP_DIR/.env.production.local"

cd "$APP_DIR"

echo "Eskiz ma'lumotlari: my.eskiz.uz -> SMS shlyuz sahifasidan oling."
read -r -p "Eskiz email: " EMAIL
read -r -s -p "Yashirin kalit (joylashtiring — ekranda ko'rinmaydi, keyin Enter): " KEY
echo ""

EMAIL="$(printf '%s' "$EMAIL" | tr -d '[:space:]')"
KEY="$(printf '%s' "$KEY" | tr -d '[:space:]')"
if [ -z "$EMAIL" ] || [ -z "$KEY" ]; then
  echo "!! Email yoki kalit bo'sh. Qaytadan urinib ko'ring: bash setup-eskiz.sh"
  exit 1
fi

echo "==> Eskiz'ga ulanib tekshirilmoqda..."
RESPONSE="$(printf '%s' "$KEY" | curl -sS -X POST https://notify.eskiz.uz/api/auth/login \
  -F "email=$EMAIL" -F "password=<-" || true)"
if [ -z "$RESPONSE" ]; then
  echo "!! Eskiz'ga ulanib bo'lmadi (internet?). Hech narsa o'zgartirilmadi — birozdan keyin qayta urinib ko'ring."
  exit 1
fi
if ! printf '%s' "$RESPONSE" | grep -q '"token"'; then
  echo "!! Eskiz bu email yoki kalitni qabul qilmadi. Hech narsa o'zgartirilmadi."
  echo "!! SMS shlyuz sahifasidagi email va Yashirin kalitni qayta nusxalab, qaytadan urinib ko'ring."
  exit 1
fi
echo "==> Eskiz ma'lumotlari to'g'ri."

touch "$ENV_FILE"
chmod 600 "$ENV_FILE"
# Drop earlier ESKIZ_ lines, and make sure the file ends with a newline so
# the new lines don't run into the last existing one.
sed -i '/^ESKIZ_/d' "$ENV_FILE"
if [ -s "$ENV_FILE" ] && [ -n "$(tail -c1 "$ENV_FILE")" ]; then
  echo "" >> "$ENV_FILE"
fi
# Next.js expands $ in .env values, so a literal one must be written as \$.
{
  printf 'ESKIZ_EMAIL=%s\n' "${EMAIL//\$/\\\$}"
  printf 'ESKIZ_PASSWORD=%s\n' "${KEY//\$/\\\$}"
  printf 'ESKIZ_FROM=4546\n'
} >> "$ENV_FILE"
unset KEY
echo "==> .env.production.local faylga yozildi."

if command -v pm2 >/dev/null 2>&1 && pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env >/dev/null
  echo "==> Sayt qayta ishga tushirildi. Endi https://findo.net.uz/kirish da SMS kodni sinab ko'ring."
else
  echo "==> PM2 da '$PM2_NAME' topilmadi — saytni o'zingiz qayta ishga tushiring."
fi
