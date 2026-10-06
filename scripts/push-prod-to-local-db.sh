#!/bin/bash
# Mirrors production's MongoDB into the local dev database, replacing it entirely.
# Requires SSH access to the production server and the local dev stack running
# (`make dev-up`). Set SSH_HOST (user@host) and, if needed, SSH_KEY once in the
# repo root's .env (gitignored, never committed) so `make push-prod-to-local-db`
# just works with no typing:
#   SSH_HOST=user@your-server-ip
#   SSH_KEY=~/.ssh/your-key
# A one-off override on the command line still wins over .env.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -z "${SSH_HOST:-}" ] && [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/.env"
  set +a
fi

: "${SSH_HOST:?Set SSH_HOST=user@host, either inline or in the repo root .env file}"
SSH_KEY="${SSH_KEY:-}"
ssh_args=()
if [ -n "$SSH_KEY" ]; then
  ssh_args+=(-i "$SSH_KEY")
fi
ssh_args+=("$SSH_HOST")

DUMP_FILE="$(mktemp -t tjalve-dump).gz"
trap 'rm -f "$DUMP_FILE"' EXIT

echo "Dumping production database via SSH ($SSH_HOST)..."
ssh "${ssh_args[@]}" bash -s -- > "$DUMP_FILE" <<'REMOTE'
set -euo pipefail
cd ~/tjalve
set -a
source .env
set +a
docker compose -f docker-compose-prod.yml exec -T mongo mongodump \
  --archive --gzip \
  -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin \
  --db tjalve
REMOTE

echo "Restoring into local dev database (this replaces all local dev data)..."
docker cp "$DUMP_FILE" tjalve-dev-mongo-1:/tmp/dump.gz
docker exec tjalve-dev-mongo-1 mongorestore \
  --archive=/tmp/dump.gz --gzip \
  --nsFrom="tjalve.*" --nsTo="tjalve-dev.*" \
  --drop
docker exec tjalve-dev-mongo-1 rm /tmp/dump.gz

echo "Done — local dev database now mirrors production."
