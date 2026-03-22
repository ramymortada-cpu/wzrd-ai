#!/bin/sh
# ═══════════════════════════════════════════
# WZRD AI — Docker Entrypoint
# Runs DB migrations before starting server
# ═══════════════════════════════════════════

set -e

echo "🔄 Running database migrations..."
if [ -f "node_modules/.bin/drizzle-kit" ]; then
  npx drizzle-kit migrate 2>&1 || echo "⚠️ Migration failed or already up to date"
else
  echo "⚠️ drizzle-kit not found — skipping migrations"
fi

echo "🚀 Starting WZRD AI server..."
exec node dist/index.js
