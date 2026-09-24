#!/usr/bin/env bash
# Topamiz backup script — snapshots the SQLite database and uploaded photos.
#
# Run manually to test:
#   bash /var/www/topamiz/backup.sh
#
# Then schedule it daily via cron. Add this line with `crontab -e` (as the
# user that owns /var/www/topamiz, typically root):
#
#   17 3 * * * /var/www/topamiz/backup.sh >> /var/log/topamiz-backup.log 2>&1
#
# (03:17 rather than 03:00 sharp — avoids piling onto every other cron job
# that fires exactly on the hour.)
#
# Backups land in /var/backups/topamiz/, one .tar.gz per run, and anything
# older than RETENTION_DAYS is deleted automatically so this can't quietly
# fill up the disk over months of unattended running.
set -euo pipefail

APP_DIR="/var/www/topamiz"
BACKUP_DIR="/var/backups/topamiz"
RETENTION_DAYS=14

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

mkdir -p "$BACKUP_DIR"

DB_PATH="$APP_DIR/.data/topamiz.db"
if [ -f "$DB_PATH" ]; then
  if command -v sqlite3 >/dev/null; then
    # .backup takes a consistent snapshot even while the app is writing to
    # the database — safer than copying the raw file (which is WAL-mode
    # and can be split across topamiz.db / -wal / -shm at any given moment).
    sqlite3 "$DB_PATH" ".backup '$WORK_DIR/topamiz.db'"
  else
    echo "!! sqlite3 CLI topilmadi (apt install sqlite3 bilan o'rnatish tavsiya etiladi)."
    echo "!! Hozircha faylni to'g'ridan-to'g'ri nusxalash bilan davom etilmoqda."
    cp "$DB_PATH" "$WORK_DIR/topamiz.db"
  fi
else
  echo "!! Baza fayli topilmadi: $DB_PATH (birinchi marta ishga tushirilganmi?)"
fi

if [ -d "$APP_DIR/.uploads" ]; then
  cp -r "$APP_DIR/.uploads" "$WORK_DIR/uploads"
fi

ARCHIVE="$BACKUP_DIR/topamiz-$TIMESTAMP.tar.gz"
tar -czf "$ARCHIVE" -C "$WORK_DIR" .
echo "==> Zaxira yaratildi: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

DELETED=$(find "$BACKUP_DIR" -name 'topamiz-*.tar.gz' -mtime "+$RETENTION_DAYS" -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "==> $RETENTION_DAYS kundan eski $DELETED ta zaxira o'chirildi."
fi
