#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push --skip-generate --accept-data-loss

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "Seeding database..."
  npx tsx prisma/seed.ts
fi

echo "Starting server on port ${PORT:-3000}..."
exec node server.js