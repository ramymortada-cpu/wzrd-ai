#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "❌ FATAL: DATABASE_URL is not set. Add MySQL plugin in Railway dashboard."
  exit 1
fi
echo "✅ DATABASE_URL is set. Proceeding with migrations..."

npx drizzle-kit migrate --force

exec "$@"
