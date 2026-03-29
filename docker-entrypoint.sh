#!/bin/sh
# ═══════════════════════════════════════════
# WZRD AI — Docker Entrypoint
# Runs DB migrations before starting server
# ═══════════════════════════════════════════

set -e

echo "🔄 Running database migrations..."
node scripts/run-drizzle-mysql-migrations.mjs

echo "🚀 Starting WZRD AI server..."
exec node dist/index.js
