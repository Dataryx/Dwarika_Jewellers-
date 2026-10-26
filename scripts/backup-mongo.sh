#!/usr/bin/env bash
# MongoDB Atlas / URI backup for Dwarika production.
# Usage (on VPS):
#   sudo mkdir -p /var/backups/mongo
#   sudo chmod +x /var/www/dwarika/scripts/backup-mongo.sh
#   # load URI from .env without printing secrets
#   set -a; source /var/www/dwarika/.env; set +a
#   /var/www/dwarika/scripts/backup-mongo.sh
#
# Cron (daily 03:15):
#   15 3 * * * set -a; . /var/www/dwarika/.env; set +a; /var/www/dwarika/scripts/backup-mongo.sh >> /var/log/dwarika-mongo-backup.log 2>&1

set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/mongo}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%F_%H%M%S)"
DEST="${BACKUP_ROOT}/${STAMP}"

if [[ -z "${MONGODB_URI:-}" ]]; then
  echo "MONGODB_URI is not set" >&2
  exit 1
fi

if ! command -v mongodump >/dev/null 2>&1; then
  echo "mongodump not found. Install MongoDB Database Tools." >&2
  exit 1
fi

mkdir -p "${DEST}"
mongodump --uri="${MONGODB_URI}" --out="${DEST}"
echo "Backup written to ${DEST}"

# Prune old backups
find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} +
echo "Pruned backups older than ${RETENTION_DAYS} days"
